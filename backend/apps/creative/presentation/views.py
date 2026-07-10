from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from ..infrastructure.persistence.models import MediaAsset, MediaFolder
from .serializers import MediaAssetSerializer, MediaFolderSerializer
from ..application.storage import get_storage_backend
from apps.productivity.infrastructure.persistence.models import ProjectActivity, Note, KnowledgeItem, CalendarEvent, Task
from rest_framework import serializers

class MediaFolderViewSet(viewsets.ModelViewSet):
    serializer_class = MediaFolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = MediaFolder.objects.filter(owner=self.request.user)

        project_param = self.request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                queryset = queryset.filter(project_id=int(project_param))
            else:
                queryset = queryset.filter(project__slug=project_param)

        parent_param = self.request.query_params.get("parent")
        if parent_param is not None:
            if parent_param == "root" or parent_param == "" or parent_param == "null":
                queryset = queryset.filter(parent__isnull=True)
            elif parent_param.isdigit():
                queryset = queryset.filter(parent_id=int(parent_param))
            else:
                queryset = queryset.filter(parent__slug=parent_param)

        return queryset

    def perform_create(self, serializer):
        project = serializer.validated_data.get("project")
        if project.owner != self.request.user:
            raise serializers.ValidationError({"project": "You do not own this project."})
        
        serializer.save(owner=self.request.user)


class MediaAssetViewSet(viewsets.ModelViewSet):
    serializer_class = MediaAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = MediaAsset.objects.filter(owner=self.request.user)

        # Project Filter
        project_param = self.request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                queryset = queryset.filter(project_id=int(project_param))
            else:
                queryset = queryset.filter(project__slug=project_param)

        # Folder Filter
        folder_param = self.request.query_params.get("folder")
        if folder_param is not None:
            if folder_param == "root" or folder_param == "" or folder_param == "null":
                queryset = queryset.filter(folder__isnull=True)
            elif folder_param.isdigit():
                queryset = queryset.filter(folder_id=int(folder_param))
            else:
                queryset = queryset.filter(folder__slug=folder_param)

        asset_type = self.request.query_params.get("asset_type")
        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)

        favorite = self.request.query_params.get("favorite")
        if favorite is not None:
            queryset = queryset.filter(favorite=favorite.lower() == "true")

        archived = self.request.query_params.get("archived")
        if archived is not None:
            queryset = queryset.filter(archived=archived.lower() == "true")
        else:
            queryset = queryset.filter(archived=False)

        # Search parameter (searches title, tags, description, file_name)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(tags__icontains=search) |
                Q(description__icontains=search) |
                Q(file_name__icontains=search)
            )

        # Ordering parameter
        ordering = self.request.query_params.get("ordering")
        if ordering:
            allowed_fields = [
                "created_at", "-created_at",
                "updated_at", "-updated_at",
                "title", "-title",
                "file_size", "-file_size",
                "last_opened_at", "-last_opened_at",
            ]
            if ordering in allowed_fields:
                queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.order_by("-created_at")
        else:
            queryset = queryset.order_by("-created_at")

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_opened_at = timezone.now()
        instance.save(update_fields=["last_opened_at"])

        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Media Opened",
            metadata={
                "media_title": instance.title,
                "media_slug": instance.slug,
                "media_id": instance.id
            }
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get("file")
        if not file_obj:
            raise serializers.ValidationError({"file": "No file was uploaded."})

        # 1. Validate File Size (Max 50MB)
        if file_obj.size > 50 * 1024 * 1024:
            raise serializers.ValidationError({"file": "File size exceeds the maximum limit of 50MB."})

        # 2. Whitelist File Extension & MIME Type
        import os
        filename = file_obj.name
        ext = os.path.splitext(filename)[1].lower().replace(".", "")
        allowed_extensions = {
            'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mp3', 'wav', 
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'zip', 'rar', 'tar'
        }
        if ext not in allowed_extensions:
            raise serializers.ValidationError({"file": f"File extension '.{ext}' is not supported."})

        content_type = file_obj.content_type.lower()
        allowed_prefixes = (
            'image/', 'video/', 'audio/', 'application/pdf', 'text/', 
            'application/msword', 'application/vnd.openxmlformats-officedocument', 'application/zip'
        )
        if not content_type.startswith(allowed_prefixes):
            raise serializers.ValidationError({"file": f"MIME type '{content_type}' is not allowed."})

        # 3. Secure Filename Normalization
        import re
        from django.utils.text import get_valid_filename
        base_name, file_ext = os.path.splitext(filename)
        clean_base = re.sub(r'[^a-zA-Z0-9_\-]', '_', base_name)
        clean_base = re.sub(r'_+', '_', clean_base).strip('_')
        if not clean_base:
            clean_base = "media"
        safe_filename = get_valid_filename(f"{clean_base}{file_ext}")
        file_obj.name = safe_filename

        # Set title to filename if not explicitly provided
        title = self.request.data.get("title", "").strip()
        if not title:
            title = safe_filename

        # Save to Storage
        storage_backend = get_storage_backend()
        storage_path = storage_backend.save(safe_filename, file_obj)

        asset_type = self.request.data.get("asset_type", "Other")

        # Create model instance
        serializer.validated_data.pop('file', None)
        instance = serializer.save(
            owner=self.request.user,
            title=title,
            file_name=safe_filename,
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            storage_path=storage_path,
            asset_type=asset_type,
            thumbnail_url="",
            last_opened_at=timezone.now()
        )

        # 4. Image Thumbnail Generation
        if instance.asset_type in ["Image", "Logo", "Thumbnail"]:
            try:
                from PIL import Image as PILImage
                import io
                from django.core.files.storage import default_storage
                
                with default_storage.open(storage_path, 'rb') as f_orig:
                    orig_data = f_orig.read()
                
                image = PILImage.open(io.BytesIO(orig_data))
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")
                
                image.thumbnail((150, 150))
                thumb_io = io.BytesIO()
                image.save(thumb_io, format="JPEG", quality=85)
                thumb_content = thumb_io.getvalue()
                
                import uuid
                thumb_unique_name = f"{uuid.uuid4()}_thumb.jpg"
                thumb_storage_path = os.path.join("media_library", thumb_unique_name).replace("\\", "/")
                
                from django.core.files.base import ContentFile
                default_storage.save(thumb_storage_path, ContentFile(thumb_content))
                
                instance.thumbnail_url = storage_backend.get_url(thumb_storage_path)
                instance.save(update_fields=["thumbnail_url"])
            except Exception:
                # Fallback to full file URL
                instance.thumbnail_url = storage_backend.get_url(storage_path)
                instance.save(update_fields=["thumbnail_url"])

        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Media Uploaded",
            metadata={
                "media_title": instance.title,
                "media_slug": instance.slug,
                "media_id": instance.id
            }
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_archived = instance.archived
        old_favorite = instance.favorite

        updated_instance = serializer.save()

        if old_archived != updated_instance.archived:
            action = "Media Archived" if updated_instance.archived else "Media Restored"
        elif old_favorite != updated_instance.favorite:
            action = "Media Updated"
        else:
            action = "Media Updated"

        ProjectActivity.objects.create(
            project=updated_instance.project,
            user=self.request.user,
            action=action,
            metadata={
                "media_title": updated_instance.title,
                "media_slug": updated_instance.slug,
                "media_id": updated_instance.id
            }
        )

    def perform_destroy(self, instance):
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Media Deleted",
            metadata={
                "media_title": instance.title,
                "media_slug": instance.slug
            }
        )
        instance.delete()

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, slug=None):
        instance = self.get_object()
        
        import os
        import uuid
        from django.core.files.storage import default_storage
        
        ext = os.path.splitext(instance.file_name)[1]
        new_unique_name = f"{uuid.uuid4()}{ext}"
        new_storage_path = os.path.join("media_library", new_unique_name).replace("\\", "/")
        
        try:
            if default_storage.exists(instance.storage_path):
                with default_storage.open(instance.storage_path, 'rb') as f_src:
                    default_storage.save(new_storage_path, f_src)
            else:
                new_storage_path = instance.storage_path
        except Exception:
            new_storage_path = instance.storage_path

        new_asset = MediaAsset.objects.create(
            owner=request.user,
            project=instance.project,
            folder=instance.folder,
            related_document=instance.related_document,
            related_note=instance.related_note,
            related_knowledge=instance.related_knowledge,
            related_calendar_event=instance.related_calendar_event,
            related_task=instance.related_task,
            title=f"{instance.title} (Copy)",
            asset_type=instance.asset_type,
            description=instance.description,
            file_name=instance.file_name,
            mime_type=instance.mime_type,
            file_size=instance.file_size,
            thumbnail_url=instance.thumbnail_url,
            storage_path=new_storage_path,
            favorite=instance.favorite,
            archived=instance.archived,
            tags=instance.tags,
            last_opened_at=timezone.now()
        )

        if new_asset.asset_type == "Image":
            try:
                new_asset.thumbnail_url = get_storage_backend().get_url(new_asset.storage_path)
                new_asset.save(update_fields=["thumbnail_url"])
            except Exception:
                pass

        ProjectActivity.objects.create(
            project=new_asset.project,
            user=request.user,
            action="Media Uploaded",
            metadata={
                "media_title": new_asset.title,
                "media_slug": new_asset.slug,
                "media_id": new_asset.id
            }
        )

        serializer = self.get_serializer(new_asset)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Bulk Actions
    @action(detail=False, methods=['post'], url_path='bulk-favorite')
    def bulk_favorite(self, request):
        slugs = request.data.get("slugs", [])
        favorite = request.data.get("favorite", True)
        if not slugs:
            return Response({"error": "No slugs provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        assets = MediaAsset.objects.filter(owner=request.user, slug__in=slugs)
        count = assets.update(favorite=favorite, updated_at=timezone.now())
        
        for asset in assets:
            ProjectActivity.objects.create(
                project=asset.project,
                user=request.user,
                action="Media Updated",
                metadata={"media_title": asset.title, "media_slug": asset.slug, "media_id": asset.id}
            )
        return Response({"message": f"Updated {count} items.", "count": count})

    @action(detail=False, methods=['post'], url_path='bulk-archive')
    def bulk_archive(self, request):
        slugs = request.data.get("slugs", [])
        if not slugs:
            return Response({"error": "No slugs provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        assets = MediaAsset.objects.filter(owner=request.user, slug__in=slugs)
        count = assets.update(archived=True, updated_at=timezone.now())
        
        for asset in assets:
            ProjectActivity.objects.create(
                project=asset.project,
                user=request.user,
                action="Media Archived",
                metadata={"media_title": asset.title, "media_slug": asset.slug, "media_id": asset.id}
            )
        return Response({"message": f"Archived {count} items.", "count": count})

    @action(detail=False, methods=['post'], url_path='bulk-restore')
    def bulk_restore(self, request):
        slugs = request.data.get("slugs", [])
        if not slugs:
            return Response({"error": "No slugs provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        assets = MediaAsset.objects.filter(owner=request.user, slug__in=slugs)
        count = assets.update(archived=False, updated_at=timezone.now())
        
        for asset in assets:
            ProjectActivity.objects.create(
                project=asset.project,
                user=request.user,
                action="Media Restored",
                metadata={"media_title": asset.title, "media_slug": asset.slug, "media_id": asset.id}
            )
        return Response({"message": f"Restored {count} items.", "count": count})

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        slugs = request.data.get("slugs", [])
        if not slugs:
            return Response({"error": "No slugs provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        assets = MediaAsset.objects.filter(owner=request.user, slug__in=slugs)
        count = 0
        for asset in assets:
            ProjectActivity.objects.create(
                project=asset.project,
                user=request.user,
                action="Media Deleted",
                metadata={"media_title": asset.title, "media_slug": asset.slug}
            )
            asset.delete()
            count += 1
            
        return Response({"message": f"Deleted {count} items.", "count": count})
