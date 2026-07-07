from rest_framework import serializers
from ..infrastructure.persistence.models import Project, ProjectActivity, Note, KnowledgeItem, Task, CalendarEvent, Document


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id',
            'owner',
            'title',
            'slug',
            'description',
            'category',
            'status',
            'color',
            'icon',
            'template',
            'favorite',
            'archived',
            'project_progress',
            'last_opened_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'slug', 'last_opened_at', 'created_at', 'updated_at']

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Project.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of {valid_statuses}")
        return value


class ProjectActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    relative_time = serializers.SerializerMethodField()

    class Meta:
        model = ProjectActivity
        fields = [
            'id',
            'project',
            'project_title',
            'project_slug',
            'user',
            'username',
            'action',
            'metadata',
            'created_at',
            'relative_time',
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def get_relative_time(self, obj):
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 365:
            return f"{diff.days // 365}y ago"
        if diff.days > 30:
            return f"{diff.days // 30}mo ago"
        if diff.days > 0:
            return f"{diff.days}d ago"
        seconds = diff.seconds
        if seconds > 3600:
            return f"{seconds // 3600}h ago"
        if seconds > 60:
            return f"{seconds // 60}m ago"
        return "just now"


class NoteSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id',
            'project',
            'project_slug',
            'project_title',
            'owner',
            'owner_email',
            'title',
            'content',
            'excerpt',
            'slug',
            'favorite',
            'pinned',
            'archived',
            'word_count',
            'reading_time',
            'color',
            'template',
            'status',
            'last_opened_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 
            'owner', 
            'slug', 
            'excerpt', 
            'word_count', 
            'reading_time', 
            'last_opened_at', 
            'created_at', 
            'updated_at'
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 100:
            raise serializers.ValidationError("Title cannot exceed 100 characters")
        return value


class KnowledgeItemSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    note_title = serializers.CharField(source='note_reference.title', read_only=True)
    note_slug = serializers.CharField(source='note_reference.slug', read_only=True)

    class Meta:
        model = KnowledgeItem
        fields = [
            'id',
            'owner',
            'owner_email',
            'project',
            'project_slug',
            'project_title',
            'title',
            'description',
            'type',
            'source_url',
            'file_path',
            'note_reference',
            'note_title',
            'note_slug',
            'tags',
            'favorite',
            'pinned',
            'archived',
            'slug',
            'created_at',
            'updated_at',
            'last_opened_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'slug',
            'created_at',
            'updated_at',
            'last_opened_at',
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 255:
            raise serializers.ValidationError("Title cannot exceed 255 characters")
        return value

    def validate_type(self, value):
        valid_types = [choice[0] for choice in KnowledgeItem.TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid type. Must be one of {valid_types}")
        return value


class TaskSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    note_title = serializers.CharField(source='related_note.title', read_only=True)
    note_slug = serializers.CharField(source='related_note.slug', read_only=True)
    knowledge_title = serializers.CharField(source='related_knowledge.title', read_only=True)
    knowledge_slug = serializers.CharField(source='related_knowledge.slug', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'owner',
            'owner_email',
            'project',
            'project_slug',
            'project_title',
            'related_note',
            'note_title',
            'note_slug',
            'related_knowledge',
            'knowledge_title',
            'knowledge_slug',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'start_date',
            'estimated_time',
            'completed_at',
            'favorite',
            'archived',
            'position',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'completed_at',
            'created_at',
            'updated_at',
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 255:
            raise serializers.ValidationError("Title cannot exceed 255 characters")
        return value

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Task.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of {valid_statuses}")
        return value

    def validate_priority(self, value):
        valid_priorities = [choice[0] for choice in Task.PRIORITY_CHOICES]
        if value not in valid_priorities:
            raise serializers.ValidationError(f"Invalid priority. Must be one of {valid_priorities}")
        return value


class CalendarEventSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    task_title = serializers.CharField(source='related_task.title', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            'id',
            'owner',
            'project',
            'project_slug',
            'project_title',
            'related_task',
            'task_title',
            'title',
            'description',
            'start_datetime',
            'end_datetime',
            'all_day',
            'color',
            'event_type',
            'reminder_minutes',
            'archived',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate(self, data):
        start = data.get("start_datetime")
        end = data.get("end_datetime")
        if start and end and start > end:
            raise serializers.ValidationError("End date/time must be after start date/time.")
        return data

    def validate_event_type(self, value):
        valid_types = [choice[0] for choice in CalendarEvent.EVENT_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid event type. Must be one of {valid_types}")
        return value


class DocumentSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id',
            'project',
            'project_slug',
            'project_title',
            'owner',
            'owner_email',
            'title',
            'content',
            'excerpt',
            'slug',
            'status',
            'visibility',
            'cover_image',
            'template',
            'archived',
            'word_count',
            'reading_time',
            'last_opened_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'slug',
            'excerpt',
            'word_count',
            'reading_time',
            'last_opened_at',
            'created_at',
            'updated_at',
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 100:
            raise serializers.ValidationError("Title cannot exceed 100 characters")
        return value

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Document.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of {valid_statuses}")
        return value

    def validate_visibility(self, value):
        valid_visibilities = [choice[0] for choice in Document.VISIBILITY_CHOICES]
        if value not in valid_visibilities:
            raise serializers.ValidationError(f"Invalid visibility. Must be one of {valid_visibilities}")
        return value

    def validate(self, data):
        project = data.get("project")
        if project and self.context.get('request'):
            user = self.context['request'].user
            if project.owner != user:
                raise serializers.ValidationError({"project": "Invalid project or you do not have permission."})
        return data






