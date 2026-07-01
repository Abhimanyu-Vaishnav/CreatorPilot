from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from ..infrastructure.persistence.models import Project, ProjectActivity, Note
from .serializers import ProjectSerializer, ProjectActivitySerializer, NoteSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        # Filter projects by authenticated user
        queryset = Project.objects.filter(owner=self.request.user)

        # Filters
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        favorite = self.request.query_params.get("favorite")
        if favorite is not None:
            queryset = queryset.filter(favorite=favorite.lower() == "true")

        archived = self.request.query_params.get("archived")
        if archived is not None:
            queryset = queryset.filter(archived=archived.lower() == "true")

        # Search query parameter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Ordering query parameter
        ordering = self.request.query_params.get("ordering")
        if ordering:
            # Validate ordering fields to avoid raw SQL errors
            allowed_fields = [
                "created_at", "-created_at", 
                "updated_at", "-updated_at", 
                "title", "-title",
                "last_opened_at", "-last_opened_at"
            ]
            if ordering in allowed_fields:
                queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.order_by("-created_at")
        else:
            # Default ordering: favorited first, then newest
            queryset = queryset.order_by("-favorite", "-created_at")

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_opened_at = timezone.now()
        instance.save(update_fields=['last_opened_at'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        instance = serializer.save(
            owner=self.request.user,
            last_opened_at=timezone.now()
        )
        # Auto-record "Project Created"
        ProjectActivity.objects.create(
            project=instance,
            user=self.request.user,
            action="Project Created"
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_favorite = instance.favorite
        old_archived = instance.archived
        
        updated_instance = serializer.save()
        
        # Check what changed
        if old_favorite != updated_instance.favorite:
            action = "Favorite Added" if updated_instance.favorite else "Favorite Removed"
        elif old_archived != updated_instance.archived:
            action = "Archived" if updated_instance.archived else "Restored"
        else:
            action = "Project Updated"
            
        ProjectActivity.objects.create(
            project=updated_instance,
            user=self.request.user,
            action=action
        )

    @action(detail=True, methods=['get', 'post'], url_path='activity')
    def activity(self, request, slug=None):
        project = self.get_object()
        if request.method == 'POST':
            action_name = request.data.get('action')
            if not action_name:
                return Response({"detail": "Action name is required."}, status=status.HTTP_400_BAD_REQUEST)
            metadata = request.data.get('metadata', {})
            activity = ProjectActivity.objects.create(
                project=project,
                user=request.user,
                action=action_name,
                metadata=metadata
            )
            serializer = ProjectActivitySerializer(activity)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        activities = project.activities.all()
        serializer = ProjectActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recent-activity')
    def recent_activity(self, request):
        activities = ProjectActivity.objects.filter(project__owner=request.user)[:20]
        serializer = ProjectActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='overview')
    def overview(self, request, slug=None):
        project = self.get_object()
        recent_activities = project.activities.all()[:10]
        
        project_serializer = self.get_serializer(project)
        activity_serializer = ProjectActivitySerializer(recent_activities, many=True)
        
        age_delta = timezone.now() - project.created_at
        age_days = age_delta.days
        
        return Response({
            "project": project_serializer.data,
            "recent_activities": activity_serializer.data,
            "statistics": {
                "total_activities": project.activities.count(),
                "age_days": age_days,
                "notes_count": project.notes.filter(archived=False).count(),
                "tasks_count": 0,
                "media_count": 0,
                "knowledge_count": 0,
            }
        })

    @action(detail=True, methods=['get'], url_path='notes')
    def notes(self, request, slug=None):
        project = self.get_object()
        notes = project.notes.filter(owner=request.user)
        
        # Apply filters
        favorite = request.query_params.get("favorite")
        if favorite is not None:
            notes = notes.filter(favorite=favorite.lower() == "true")
            
        pinned = request.query_params.get("pinned")
        if pinned is not None:
            notes = notes.filter(pinned=pinned.lower() == "true")
            
        archived = request.query_params.get("archived")
        if archived is not None:
            if archived.lower() == "true":
                notes = notes.filter(archived=True)
            elif archived.lower() == "false":
                notes = notes.filter(archived=False)
        else:
            notes = notes.filter(archived=False)
            
        status_param = request.query_params.get("status")
        if status_param:
            notes = notes.filter(status=status_param)
            
        search = request.query_params.get("search")
        if search:
            notes = notes.filter(
                Q(title__icontains=search) | Q(content__icontains=search) | Q(slug__icontains=search)
            )
            
        ordering = request.query_params.get("ordering")
        if ordering:
            allowed_fields = [
                "title", "-title",
                "created_at", "-created_at",
                "updated_at", "-updated_at",
                "last_opened_at", "-last_opened_at"
            ]
            if ordering in allowed_fields:
                notes = notes.order_by(ordering)
            else:
                notes = notes.order_by("-pinned", "-favorite", "-updated_at")
        else:
            notes = notes.order_by("-pinned", "-favorite", "-updated_at")
            
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Note.objects.filter(owner=self.request.user)

        # Filter by project (slug or ID)
        project_param = self.request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                queryset = queryset.filter(project_id=project_param)
            else:
                queryset = queryset.filter(project__slug=project_param)

        # Filters
        favorite = self.request.query_params.get("favorite")
        if favorite is not None:
            queryset = queryset.filter(favorite=favorite.lower() == "true")

        pinned = self.request.query_params.get("pinned")
        if pinned is not None:
            queryset = queryset.filter(pinned=pinned.lower() == "true")

        archived = self.request.query_params.get("archived")
        if archived is not None:
            if archived.lower() == "true":
                queryset = queryset.filter(archived=True)
            elif archived.lower() == "false":
                queryset = queryset.filter(archived=False)
        else:
            queryset = queryset.filter(archived=False)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search) | Q(slug__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get("ordering")
        if ordering:
            allowed_fields = [
                "title", "-title",
                "created_at", "-created_at",
                "updated_at", "-updated_at",
                "last_opened_at", "-last_opened_at"
            ]
            if ordering in allowed_fields:
                queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.order_by("-pinned", "-favorite", "-updated_at")
        else:
            queryset = queryset.order_by("-pinned", "-favorite", "-updated_at")

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            owner=self.request.user,
            last_opened_at=timezone.now()
        )
        # Auto-record activity
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Note Created",
            metadata={
                "note_title": instance.title,
                "note_slug": instance.slug,
                "note_id": instance.id
            }
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_opened_at = timezone.now()
        instance.save(update_fields=['last_opened_at'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_pinned = instance.pinned
        old_favorite = instance.favorite
        old_archived = instance.archived
        old_status = instance.status

        updated_instance = serializer.save()

        # Check what changed
        action_name = "Note Updated"
        if old_pinned != updated_instance.pinned:
            action_name = "Note Pinned" if updated_instance.pinned else "Note Unpinned"
        elif old_favorite != updated_instance.favorite:
            action_name = "Note Favorited" if updated_instance.favorite else "Note Unfavorited"
        elif old_archived != updated_instance.archived:
            action_name = "Note Archived" if updated_instance.archived else "Note Restored"
        elif old_status != updated_instance.status:
            action_name = f"Note Status Set to {updated_instance.status}"

        ProjectActivity.objects.create(
            project=updated_instance.project,
            user=self.request.user,
            action=action_name,
            metadata={
                "note_title": updated_instance.title,
                "note_slug": updated_instance.slug,
                "note_id": updated_instance.id
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Auto-record activity before deleting
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Note Deleted",
            metadata={
                "note_title": instance.title,
                "note_slug": instance.slug,
                "note_id": instance.id
            }
        )
        return super().destroy(request, *args, **kwargs)


