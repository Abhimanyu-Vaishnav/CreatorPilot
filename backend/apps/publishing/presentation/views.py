from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from ..infrastructure.persistence.models import PublishPlatform, PublishItem, PublishHistory
from .serializers import PublishPlatformSerializer, PublishItemSerializer, PublishHistorySerializer
from apps.productivity.infrastructure.persistence.models import Project, CalendarEvent, ProjectActivity

class PublishPlatformViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublishPlatformSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PublishPlatform.objects.filter(enabled=True)

class PublishItemViewSet(viewsets.ModelViewSet):
    serializer_class = PublishItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def log_activity(self, item, action, metadata=None):
        if metadata is None:
            metadata = {}
        metadata.update({
            "publish_item_id": item.id,
            "publish_item_title": item.title,
            "publish_item_slug": item.slug,
            "platform": item.platform.name
        })
        try:
            ProjectActivity.objects.create(
                project=item.project,
                user=self.request.user,
                action=action,
                metadata=metadata
            )
        except Exception:
            pass

    def get_queryset(self):
        queryset = PublishItem.objects.filter(owner=self.request.user)

        # Filters
        project_param = self.request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                queryset = queryset.filter(project_id=int(project_param))
            else:
                queryset = queryset.filter(project__slug=project_param)

        platform_param = self.request.query_params.get("platform")
        if platform_param:
            if platform_param.isdigit():
                queryset = queryset.filter(platform_id=int(platform_param))
            else:
                queryset = queryset.filter(platform__name__icontains=platform_param)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        approval_param = self.request.query_params.get("approval_status")
        if approval_param:
            queryset = queryset.filter(approval_status=approval_param)

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(platform__name__icontains=search) |
                Q(project__title__icontains=search) |
                Q(status__icontains=search) |
                Q(content__icontains=search)
            )

        # Sorting
        ordering = self.request.query_params.get("ordering", "newest")
        ordering_map = {
            "newest": "-created_at",
            "oldest": "created_at",
            "scheduled": "scheduled_at",
            "published": "published_at",
            "alphabetical": "title",
            "recently_edited": "-updated_at"
        }
        db_ordering = ordering_map.get(ordering, "-created_at")
        
        # Handle cases where scheduled_at or published_at might be null (nulls last)
        if db_ordering.endswith("scheduled_at"):
            queryset = queryset.order_by(models.F('scheduled_at').asc(nulls_last=True) if db_ordering == "scheduled_at" else models.F('scheduled_at').desc(nulls_last=True))
        elif db_ordering.endswith("published_at"):
            queryset = queryset.order_by(models.F('published_at').asc(nulls_last=True) if db_ordering == "published_at" else models.F('published_at').desc(nulls_last=True))
        else:
            queryset = queryset.order_by(db_ordering)

        return queryset

    def perform_create(self, serializer):
        item = serializer.save(owner=self.request.user)
        PublishHistory.objects.create(
            publish_item=item,
            action="Draft Created",
            performed_by=self.request.user,
            notes="Initial draft created"
        )
        self.log_activity(item, "Draft Created")

    def perform_update(self, serializer):
        item = serializer.save()
        PublishHistory.objects.create(
            publish_item=item,
            action="Updated",
            performed_by=self.request.user,
            notes="Publish item content or settings updated"
        )
        self.log_activity(item, "Updated")

    def perform_destroy(self, instance):
        self.log_activity(instance, "Deleted")
        instance.delete()

    @action(detail=True, methods=["post"])
    def schedule(self, request, slug=None):
        item = self.get_object()
        scheduled_at_str = request.data.get("scheduled_at")
        tz = request.data.get("timezone", "UTC")

        if not scheduled_at_str:
            return Response({"detail": "scheduled_at is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dt = timezone.datetime.fromisoformat(scheduled_at_str.replace("Z", "+00:00"))
            if timezone.is_naive(dt):
                scheduled_at = timezone.make_aware(dt)
            else:
                scheduled_at = dt
        except Exception as e:
            return Response({"detail": f"Invalid scheduled_at format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        item.scheduled_at = scheduled_at
        item.timezone = tz
        item.status = "Scheduled"
        item.save()

        # Sync with Calendar
        event_title = f"[{item.platform.name}] {item.title}"
        event_desc = f"Publishing Item: {item.title}\nPlatform: {item.platform.name}\nStatus: Scheduled"
        
        # Look for existing calendar event
        cal_event = CalendarEvent.objects.filter(related_publish_item=item, archived=False).first()
        if cal_event:
            cal_event.title = event_title
            cal_event.description = event_desc
            cal_event.start_datetime = scheduled_at
            cal_event.end_datetime = scheduled_at + timedelta(minutes=30)
            cal_event.save()
        else:
            CalendarEvent.objects.create(
                owner=request.user,
                project=item.project,
                related_publish_item=item,
                title=event_title,
                description=event_desc,
                start_datetime=scheduled_at,
                end_datetime=scheduled_at + timedelta(minutes=30),
                event_type="Content Plan",
                color=item.platform.color
            )

        PublishHistory.objects.create(
            publish_item=item,
            action="Scheduled",
            performed_by=request.user,
            notes=f"Scheduled for {scheduled_at_str} ({tz})"
        )
        self.log_activity(item, "Scheduled", {"scheduled_at": scheduled_at_str})

        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, slug=None):
        item = self.get_object()
        item.approval_status = "Approved"
        # Optional: set reviewer
        item.reviewer = request.user
        item.save()

        PublishHistory.objects.create(
            publish_item=item,
            action="Approved",
            performed_by=request.user,
            notes="Publish item approved for release"
        )
        self.log_activity(item, "Approved")

        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, slug=None):
        item = self.get_object()
        item.approval_status = "Rejected"
        item.status = "Draft" # revert back to draft on rejection
        item.reviewer = request.user
        item.save()

        PublishHistory.objects.create(
            publish_item=item,
            action="Rejected",
            performed_by=request.user,
            notes=request.data.get("notes", "Rejected by reviewer")
        )
        self.log_activity(item, "Rejected", {"notes": request.data.get("notes")})

        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, slug=None):
        item = self.get_object()
        
        # Clone fields
        new_item = PublishItem.objects.create(
            owner=request.user,
            project=item.project,
            document=item.document,
            title=f"{item.title} Copy",
            platform=item.platform,
            content_type=item.content_type,
            status="Draft",
            excerpt=item.excerpt,
            content=item.content,
            featured_media=item.featured_media,
            timezone=item.timezone,
            approval_status="Pending",
            reviewer=None,
            notes=item.notes,
            tags=item.tags,
            seo_title=item.seo_title,
            seo_description=item.seo_description,
            canonical_url=None
        )

        # Clone ManyToMany relationship
        if item.additional_media.exists():
            new_item.additional_media.set(item.additional_media.all())

        PublishHistory.objects.create(
            publish_item=new_item,
            action="Draft Created",
            performed_by=request.user,
            notes=f"Duplicated from {item.title}"
        )
        self.log_activity(new_item, "Duplicated", {"from_item_id": item.id})

        return Response(self.get_serializer(new_item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        item = self.get_object()
        item.status = "Published"
        item.published_at = timezone.now()
        item.save()

        PublishHistory.objects.create(
            publish_item=item,
            action="Published",
            performed_by=request.user,
            notes="Manually published content"
        )
        self.log_activity(item, "Published")

        # Update Calendar Event to show published
        cal_event = CalendarEvent.objects.filter(related_publish_item=item, archived=False).first()
        if cal_event:
            cal_event.title = f"[PUBLISHED] {item.title}"
            cal_event.description = f"Published at {item.published_at}"
            cal_event.color = "#10b981" # Green color to represent published
            cal_event.save()

        return Response(self.get_serializer(item).data)
