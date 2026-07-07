from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from ..infrastructure.persistence.models import Project, ProjectActivity, Note, KnowledgeItem, Task, CalendarEvent, Document
from .serializers import ProjectSerializer, ProjectActivitySerializer, NoteSerializer, KnowledgeItemSerializer, TaskSerializer, CalendarEventSerializer, DocumentSerializer
from django.utils.dateparse import parse_datetime
from datetime import timedelta


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
                "tasks_count": project.tasks.filter(archived=False).count(),
                "media_count": 0,
                "knowledge_count": project.knowledge_items.filter(archived=False).count(),
            }
        })

    @action(detail=True, methods=['get', 'post'], url_path='knowledge')
    def knowledge(self, request, slug=None):
        project = self.get_object()
        if request.method == 'POST':
            data = request.data.copy()
            data['project'] = project.id
            serializer = KnowledgeItemSerializer(data=data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            self.perform_create_knowledge(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        items = project.knowledge_items.filter(owner=request.user)
        
        favorite = request.query_params.get("favorite")
        if favorite is not None:
            items = items.filter(favorite=favorite.lower() == "true")
            
        pinned = request.query_params.get("pinned")
        if pinned is not None:
            items = items.filter(pinned=pinned.lower() == "true")
            
        archived = request.query_params.get("archived")
        if archived is not None:
            if archived.lower() == "true":
                items = items.filter(archived=True)
            elif archived.lower() == "false":
                items = items.filter(archived=False)
        else:
            items = items.filter(archived=False)
            
        type_param = request.query_params.get("type")
        if type_param:
            items = items.filter(type=type_param)
            
        search = request.query_params.get("search")
        if search:
            items = items.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(source_url__icontains=search) |
                Q(tags__icontains=search)
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
                items = items.order_by(ordering)
            else:
                items = items.order_by("-pinned", "-favorite", "-updated_at")
        else:
            items = items.order_by("-pinned", "-favorite", "-updated_at")
            
        serializer = KnowledgeItemSerializer(items, many=True)
        return Response(serializer.data)

    def perform_create_knowledge(self, serializer):
        instance = serializer.save(
            owner=self.request.user,
            last_opened_at=timezone.now()
        )
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Knowledge Created",
            metadata={
                "knowledge_title": instance.title,
                "knowledge_slug": instance.slug,
                "knowledge_id": instance.id
            }
        )

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

    @action(detail=True, methods=['get'], url_path='documents')
    def documents(self, request, slug=None):
        project = self.get_object()
        documents = project.documents.filter(owner=request.user)
        
        # Archived filter
        archived = request.query_params.get("archived")
        if archived is not None:
            if archived.lower() == "true":
                documents = documents.filter(archived=True)
            elif archived.lower() == "false":
                documents = documents.filter(archived=False)
        else:
            documents = documents.filter(archived=False)
        
        # Apply filters
        status_param = request.query_params.get("status")
        if status_param:
            documents = documents.filter(status=status_param)
            
        visibility_param = request.query_params.get("visibility")
        if visibility_param:
            documents = documents.filter(visibility=visibility_param)
            
        search = request.query_params.get("search")
        if search:
            documents = documents.filter(
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
                documents = documents.order_by(ordering)
            else:
                documents = documents.order_by("-updated_at")
        else:
            documents = documents.order_by("-updated_at")
            
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='tasks')
    def tasks(self, request, slug=None):
        project = self.get_object()
        if request.method == 'POST':
            data = request.data.copy()
            data['project'] = project.id
            serializer = TaskSerializer(data=data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            self.perform_create_task(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        tasks = project.tasks.filter(owner=request.user)
        
        favorite = request.query_params.get("favorite")
        if favorite is not None:
            tasks = tasks.filter(favorite=favorite.lower() == "true")
            
        archived = request.query_params.get("archived")
        if archived is not None:
            if archived.lower() == "true":
                tasks = tasks.filter(archived=True)
            elif archived.lower() == "false":
                tasks = tasks.filter(archived=False)
        else:
            tasks = tasks.filter(archived=False)
            
        status_param = request.query_params.get("status")
        if status_param:
            tasks = tasks.filter(status=status_param)
            
        priority = request.query_params.get("priority")
        if priority:
            tasks = tasks.filter(priority=priority)
            
        search = request.query_params.get("search")
        if search:
            tasks = tasks.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
            
        ordering = request.query_params.get("ordering")
        if ordering:
            allowed_fields = [
                "created_at", "-created_at",
                "updated_at", "-updated_at",
                "due_date", "-due_date",
                "position", "-position",
                "priority", "-priority",
            ]
            if ordering in allowed_fields:
                tasks = tasks.order_by(ordering)
            else:
                tasks = tasks.order_by("position", "-created_at")
        else:
            tasks = tasks.order_by("position", "-created_at")
            
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def perform_create_task(self, serializer):
        instance = serializer.save(owner=self.request.user)
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Task Created",
            metadata={
                "task_title": instance.title,
                "task_id": instance.id
            }
        )


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


class KnowledgeItemViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = KnowledgeItem.objects.filter(owner=self.request.user)

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

        type_param = self.request.query_params.get("type")
        if type_param:
            queryset = queryset.filter(type=type_param)

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(source_url__icontains=search) |
                Q(tags__icontains=search)
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
            action="Knowledge Created",
            metadata={
                "knowledge_title": instance.title,
                "knowledge_slug": instance.slug,
                "knowledge_id": instance.id
            }
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_opened_at = timezone.now()
        instance.save(update_fields=['last_opened_at'])

        # Auto-record activity
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Knowledge Opened",
            metadata={
                "knowledge_title": instance.title,
                "knowledge_slug": instance.slug,
                "knowledge_id": instance.id
            }
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_pinned = instance.pinned
        old_favorite = instance.favorite
        old_archived = instance.archived

        updated_instance = serializer.save()

        # Check what changed
        action_name = "Knowledge Updated"
        if old_pinned != updated_instance.pinned:
            action_name = "Knowledge Pinned" if updated_instance.pinned else "Knowledge Unpinned"
        elif old_favorite != updated_instance.favorite:
            action_name = "Knowledge Favorited" if updated_instance.favorite else "Knowledge Unfavorited"
        elif old_archived != updated_instance.archived:
            action_name = "Knowledge Archived" if updated_instance.archived else "Knowledge Restored"

        ProjectActivity.objects.create(
            project=updated_instance.project,
            user=self.request.user,
            action=action_name,
            metadata={
                "knowledge_title": updated_instance.title,
                "knowledge_slug": updated_instance.slug,
                "knowledge_id": updated_instance.id
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Auto-record activity before deleting
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Knowledge Deleted",
            metadata={
                "knowledge_title": instance.title,
                "knowledge_slug": instance.slug,
                "knowledge_id": instance.id
            }
        )
        return super().destroy(request, *args, **kwargs)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(owner=self.request.user)

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

        priority_param = self.request.query_params.get("priority")
        if priority_param:
            queryset = queryset.filter(priority=priority_param)

        # Due Today / Overdue
        due_today = self.request.query_params.get("due_today")
        if due_today is not None and due_today.lower() == "true":
            from django.utils import timezone
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            queryset = queryset.filter(due_date__range=(today_start, today_end))

        overdue = self.request.query_params.get("overdue")
        if overdue is not None and overdue.lower() == "true":
            from django.utils import timezone
            now = timezone.now()
            queryset = queryset.filter(due_date__lt=now, archived=False).exclude(status="Completed")

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get("ordering")
        if ordering:
            allowed_fields = {
                "created_at": "created_at",
                "-created_at": "-created_at",
                "updated_at": "updated_at",
                "-updated_at": "-updated_at",
                "due_date": "due_date",
                "-due_date": "-due_date",
                "priority": "priority",
                "-priority": "-priority",
                "position": "position",
                "-position": "-position",
            }
            if ordering in allowed_fields:
                queryset = queryset.order_by(allowed_fields[ordering])
            else:
                queryset = queryset.order_by("position", "-created_at")
        else:
            queryset = queryset.order_by("position", "-created_at")

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Task Created",
            metadata={
                "task_title": instance.title,
                "task_id": instance.id
            }
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        old_archived = instance.archived
        old_favorite = instance.favorite

        updated_instance = serializer.save()

        # Log Activity
        action_name = "Task Updated"
        if old_archived != updated_instance.archived:
            action_name = "Task Archived" if updated_instance.archived else "Task Restored"
        elif old_status != updated_instance.status:
            if updated_instance.status == "Completed":
                action_name = "Task Completed"
            elif old_status == "Completed":
                action_name = "Task Reopened"
            else:
                action_name = f"Task Status Set to {updated_instance.status}"
        elif old_favorite != updated_instance.favorite:
            action_name = "Task Favorited" if updated_instance.favorite else "Task Unfavorited"

        ProjectActivity.objects.create(
            project=updated_instance.project,
            user=self.request.user,
            action=action_name,
            metadata={
                "task_title": updated_instance.title,
                "task_id": updated_instance.id
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Task Deleted",
            metadata={
                "task_title": instance.title,
                "task_id": instance.id
            }
        )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        task_ids = request.data.get("task_ids", [])
        status_val = request.data.get("status")

        if not task_ids:
            return Response({"detail": "task_ids is required."}, status=status.HTTP_400_BAD_REQUEST)

        tasks = Task.objects.filter(id__in=task_ids, owner=request.user)
        task_dict = {t.id: t for t in tasks}

        updated_tasks = []
        for idx, tid in enumerate(task_ids):
            task = task_dict.get(int(tid)) if isinstance(tid, int) or tid.isdigit() else task_dict.get(tid)
            if task:
                task.position = idx
                if status_val:
                    if task.status != status_val:
                        old_status = task.status
                        task.status = status_val
                        if status_val == "Completed":
                            action_name = "Task Completed"
                        elif old_status == "Completed":
                            action_name = "Task Reopened"
                        else:
                            action_name = f"Task Status Set to {status_val}"
                        ProjectActivity.objects.create(
                            project=task.project,
                            user=request.user,
                            action=action_name,
                            metadata={
                                "task_title": task.title,
                                "task_id": task.id
                            }
                        )
                task.save()
                updated_tasks.append(task)

        projects = {t.project for t in updated_tasks}
        for project in projects:
            Task.update_project_progress_for_project(project)

        return Response({"detail": "Tasks reordered successfully."})


class CalendarViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CalendarEvent.objects.filter(owner=self.request.user)

    def _format_task_as_event(self, task):
        # Fallback start time is 1 hour before due date if start_date is not set
        start_dt = task.start_date
        if not start_dt and task.due_date:
            start_dt = task.due_date - timedelta(hours=1)
        
        return {
            "id": f"task_{task.id}",
            "owner": task.owner_id,
            "project": task.project_id,
            "project_slug": task.project.slug if task.project else None,
            "project_title": task.project.title if task.project else None,
            "related_task": task.id,
            "task_title": task.title,
            "title": task.title,
            "description": task.description,
            "start_datetime": start_dt.isoformat() if start_dt else None,
            "end_datetime": task.due_date.isoformat() if task.due_date else None,
            "all_day": False,
            "color": "#f59e0b" if task.priority in ["High", "Urgent"] else "#3b82f6",
            "event_type": "Task",
            "task_status": task.status,
            "reminder_minutes": 0,
            "archived": task.archived,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
        }

    def list(self, request, *args, **kwargs):
        # 1. Parse date filters
        start_param = request.query_params.get("start_date") or request.query_params.get("start")
        end_param = request.query_params.get("end_date") or request.query_params.get("end")
        
        start_dt = parse_datetime(start_param) if start_param else None
        end_dt = parse_datetime(end_param) if end_param else None

        # Base queries
        event_qs = CalendarEvent.objects.filter(owner=request.user)
        task_qs = Task.objects.filter(owner=request.user, due_date__isnull=False)

        # 1.5 Archived filter
        archived_param = request.query_params.get("archived")
        if archived_param is not None:
            is_archived = archived_param.lower() == "true"
            event_qs = event_qs.filter(archived=is_archived)
            task_qs = task_qs.filter(archived=is_archived)
        else:
            event_qs = event_qs.filter(archived=False)
            task_qs = task_qs.filter(archived=False)

        # 2. Date filters
        if start_dt and end_dt:
            # Overlapping events: event start < end_dt AND event end > start_dt
            event_qs = event_qs.filter(start_datetime__lt=end_dt, end_datetime__gt=start_dt)
            task_qs = task_qs.filter(due_date__gte=start_dt, due_date__lte=end_dt)
        elif start_dt:
            event_qs = event_qs.filter(end_datetime__gte=start_dt)
            task_qs = task_qs.filter(due_date__gte=start_dt)
        elif end_dt:
            event_qs = event_qs.filter(start_datetime__lte=end_dt)
            task_qs = task_qs.filter(due_date__lte=end_dt)

        # 3. Project filter (slug or ID)
        project_param = request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                event_qs = event_qs.filter(project_id=project_param)
                task_qs = task_qs.filter(project_id=project_param)
            else:
                event_qs = event_qs.filter(project__slug=project_param)
                task_qs = task_qs.filter(project__slug=project_param)

        # 4. Search query
        search_param = request.query_params.get("search")
        if search_param:
            event_qs = event_qs.filter(
                Q(title__icontains=search_param) | Q(description__icontains=search_param)
            )
            task_qs = task_qs.filter(
                Q(title__icontains=search_param) | Q(description__icontains=search_param)
            )

        # 5. Type filtering
        type_param = request.query_params.get("event_type")
        if type_param:
            if type_param == "Task":
                event_qs = event_qs.none()
            else:
                event_qs = event_qs.filter(event_type=type_param)
                task_qs = task_qs.none()

        # Feature 9: specific helper filters
        today_filter = request.query_params.get("today")
        if today_filter and today_filter.lower() == "true":
            from django.utils import timezone
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            event_qs = event_qs.filter(start_datetime__lt=today_end, end_datetime__gt=today_start)
            task_qs = task_qs.filter(due_date__range=(today_start, today_end))

        upcoming_filter = request.query_params.get("upcoming")
        if upcoming_filter and upcoming_filter.lower() == "true":
            from django.utils import timezone
            now = timezone.now()
            event_qs = event_qs.filter(start_datetime__gt=now)
            task_qs = task_qs.filter(due_date__gt=now)

        completed_tasks_filter = request.query_params.get("completed_tasks")
        if completed_tasks_filter is not None:
            if completed_tasks_filter.lower() == "true":
                # We only show completed tasks
                event_qs = event_qs.none()
                task_qs = task_qs.filter(status="Completed")
            else:
                # Exclude completed tasks
                task_qs = task_qs.exclude(status="Completed")

        # Fetch and serialize
        events = event_qs.select_related("project", "related_task")
        serialized_events = CalendarEventSerializer(events, many=True).data

        tasks = task_qs.select_related("project")
        # Exclude tasks that are already linked to a CalendarEvent
        linked_task_ids = set(CalendarEvent.objects.filter(owner=request.user, related_task__isnull=False).values_list("related_task_id", flat=True))
        serialized_tasks = [
            self._format_task_as_event(t)
            for t in tasks
            if t.id not in linked_task_ids
        ]

        # Merge results
        merged = serialized_events + serialized_tasks
        
        # Sort by start_datetime
        def get_start_key(item):
            val = item.get("start_datetime")
            return val if val else ""
            
        merged.sort(key=get_start_key)

        # Pagination support
        page = self.paginate_queryset(merged)
        if page is not None:
            return self.get_paginated_response(page)

        return Response(merged)

    def retrieve(self, request, pk=None, *args, **kwargs):
        if pk and str(pk).startswith("task_"):
            try:
                task_id = int(str(pk).split("_")[1])
                task = Task.objects.select_related("project").get(id=task_id, owner=request.user)
                return Response(self._format_task_as_event(task))
            except (ValueError, IndexError, Task.DoesNotExist):
                return Response({"detail": "Task event not found."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            event = CalendarEvent.objects.select_related("project", "related_task").get(id=pk, owner=request.user)
            serializer = CalendarEventSerializer(event)
            return Response(serializer.data)
        except CalendarEvent.DoesNotExist:
            return Response({"detail": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        
        # Log to ProjectActivity if project exists
        if instance.project:
            ProjectActivity.objects.create(
                project=instance.project,
                user=self.request.user,
                action="Event Created",
                metadata={
                    "event_title": instance.title,
                    "event_id": instance.id,
                    "event_type": instance.event_type
                }
            )

    def update(self, request, pk=None, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        
        if pk and str(pk).startswith("task_"):
            try:
                task_id = int(str(pk).split("_")[1])
                task = Task.objects.select_related("project").get(id=task_id, owner=request.user)
                
                old_status = task.status
                old_due_date = task.due_date
                old_archived = task.archived
                
                # Update task fields from request data
                title = request.data.get("title")
                description = request.data.get("description")
                task_status = request.data.get("task_status") or request.data.get("status")
                start_datetime = request.data.get("start_datetime")
                end_datetime = request.data.get("end_datetime") or request.data.get("due_date")
                archived = request.data.get("archived")
                
                if title is not None:
                    task.title = title
                if description is not None:
                    task.description = description
                if task_status is not None:
                    task.status = task_status
                if end_datetime is not None:
                    task.due_date = parse_datetime(end_datetime) if end_datetime else None
                if start_datetime is not None:
                    task.start_date = parse_datetime(start_datetime) if start_datetime else None
                if archived is not None:
                    task.archived = archived
                
                task.save()
                
                # Log Activity
                if old_status != task.status and task.project:
                    action_name = "Task Completed" if task.status == "Completed" else "Task Reopened"
                    ProjectActivity.objects.create(
                        project=task.project,
                        user=request.user,
                        action=action_name,
                        metadata={
                            "task_title": task.title,
                            "task_id": task.id
                        }
                    )
                elif old_archived != task.archived and task.project:
                    action_name = "Task Archived" if task.archived else "Task Restored"
                    ProjectActivity.objects.create(
                        project=task.project,
                        user=request.user,
                        action=action_name,
                        metadata={
                            "task_title": task.title,
                            "task_id": task.id
                        }
                    )
                
                return Response(self._format_task_as_event(task))
            except (ValueError, IndexError, Task.DoesNotExist):
                return Response({"detail": "Task event not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            event = CalendarEvent.objects.get(id=pk, owner=request.user)
            old_reminder = event.reminder_minutes
            old_type = event.event_type
            old_archived = event.archived
            
            serializer = self.get_serializer(event, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            updated_event = serializer.save()
            
            # Log Activity
            if updated_event.project:
                actions = []
                if old_reminder != updated_event.reminder_minutes:
                    actions.append("Reminder Changed")
                
                # If milestone completed
                # (since CalendarEvent doesn't have completed field directly, we can check metadata or state update)
                # But let's log "Event Updated" generally
                action_label = "Event Updated"
                if old_archived != updated_event.archived:
                    action_label = "Event Archived" if updated_event.archived else "Event Restored"
                elif updated_event.event_type == "Milestone" and old_type != "Milestone":
                    action_label = "Milestone Created"
                
                ProjectActivity.objects.create(
                    project=updated_event.project,
                    user=request.user,
                    action=action_label,
                    metadata={
                        "event_title": updated_event.title,
                        "event_id": updated_event.id,
                        "event_type": updated_event.event_type
                    }
                )
                
                for act in actions:
                    ProjectActivity.objects.create(
                        project=updated_event.project,
                        user=request.user,
                        action=act,
                        metadata={
                            "event_title": updated_event.title,
                            "event_id": updated_event.id,
                            "reminder_minutes": updated_event.reminder_minutes
                        }
                    )

            return Response(serializer.data)
        except CalendarEvent.DoesNotExist:
            return Response({"detail": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None, *args, **kwargs):
        if pk and str(pk).startswith("task_"):
            try:
                task_id = int(str(pk).split("_")[1])
                task = Task.objects.get(id=task_id, owner=request.user)
                
                if task.project:
                    ProjectActivity.objects.create(
                        project=task.project,
                        user=request.user,
                        action="Task Deleted",
                        metadata={
                            "task_title": task.title,
                            "task_id": task.id
                        }
                    )
                
                task.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except (ValueError, IndexError, Task.DoesNotExist):
                return Response({"detail": "Task event not found."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            event = CalendarEvent.objects.get(id=pk, owner=request.user)
            
            if event.project:
                ProjectActivity.objects.create(
                    project=event.project,
                    user=request.user,
                    action="Event Deleted",
                    metadata={
                        "event_title": event.title,
                        "event_id": event.id,
                        "event_type": event.event_type
                    }
                )
            
            event.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CalendarEvent.DoesNotExist:
            return Response({"detail": "Calendar event not found."}, status=status.HTTP_404_NOT_FOUND)


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Document.objects.filter(owner=self.request.user)

        # Archived filter
        if self.action == "list":
            archived = self.request.query_params.get("archived")
            if archived is not None:
                if archived.lower() == "true":
                    queryset = queryset.filter(archived=True)
                elif archived.lower() == "false":
                    queryset = queryset.filter(archived=False)
            else:
                queryset = queryset.filter(archived=False)

        # Filter by project (slug or ID)
        project_param = self.request.query_params.get("project")
        if project_param:
            if project_param.isdigit():
                queryset = queryset.filter(project_id=project_param)
            else:
                queryset = queryset.filter(project__slug=project_param)

        # Filters
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        visibility_param = self.request.query_params.get("visibility")
        if visibility_param:
            queryset = queryset.filter(visibility=visibility_param)

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
                queryset = queryset.order_by("-updated_at")
        else:
            queryset = queryset.order_by("-updated_at")

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_opened_at = timezone.now()
        instance.save(update_fields=['last_opened_at'])
        
        # Log Document Opened activity
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Document Opened",
            metadata={
                "document_title": instance.title,
                "document_slug": instance.slug,
                "document_id": instance.id
            }
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        instance = serializer.save(
            owner=self.request.user,
            last_opened_at=timezone.now()
        )
        # Log Document Created
        ProjectActivity.objects.create(
            project=instance.project,
            user=self.request.user,
            action="Document Created",
            metadata={
                "document_title": instance.title,
                "document_slug": instance.slug,
                "document_id": instance.id
            }
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        old_archived = instance.archived
        updated_instance = serializer.save()

        # Log Status Change or Document Updated or Archive/Restore
        if old_archived != updated_instance.archived:
            action = "Document Archived" if updated_instance.archived else "Document Restored"
            metadata = {
                "document_title": updated_instance.title,
                "document_slug": updated_instance.slug,
                "document_id": updated_instance.id
            }
        elif old_status != updated_instance.status:
            action = "Document Status Changed"
            metadata = {
                "document_title": updated_instance.title,
                "document_slug": updated_instance.slug,
                "document_id": updated_instance.id,
                "old_status": old_status,
                "new_status": updated_instance.status
            }
        else:
            action = "Document Updated"
            metadata = {
                "document_title": updated_instance.title,
                "document_slug": updated_instance.slug,
                "document_id": updated_instance.id
            }

        ProjectActivity.objects.create(
            project=updated_instance.project,
            user=self.request.user,
            action=action,
            metadata=metadata
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Log Document Deleted before deleting
        ProjectActivity.objects.create(
            project=instance.project,
            user=request.user,
            action="Document Deleted",
            metadata={
                "document_title": instance.title,
                "document_slug": instance.slug,
                "document_id": instance.id
            }
        )
        return super().destroy(request, *args, **kwargs)
