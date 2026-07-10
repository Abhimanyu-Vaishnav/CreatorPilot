from rest_framework import serializers
from ..infrastructure.persistence.models import MediaAsset, MediaFolder
from apps.productivity.infrastructure.persistence.models import Project, Document, Note, KnowledgeItem, CalendarEvent, Task
from ..application.storage import get_storage_backend

class MediaFolderSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    parent_slug = serializers.CharField(source='parent.slug', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = MediaFolder
        fields = [
            'id',
            'owner',
            'project',
            'project_slug',
            'project_title',
            'parent',
            'parent_slug',
            'parent_name',
            'name',
            'slug',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'slug',
            'created_at',
            'updated_at',
        ]

    def validate(self, data):
        project = data.get("project")
        parent = data.get("parent")
        request = self.context.get("request")

        if project and request:
            if project.owner != request.user:
                raise serializers.ValidationError({"project": "Invalid project or you do not have permission."})

        if parent and request:
            if parent.owner != request.user:
                raise serializers.ValidationError({"parent": "Invalid parent folder or you do not have permission."})
            if project and parent.project != project:
                raise serializers.ValidationError({"parent": "Parent folder must belong to the selected project."})

        return data

class MediaAssetSerializer(serializers.ModelSerializer):
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    
    # Linked Document
    related_document_title = serializers.CharField(source='related_document.title', read_only=True)
    related_document_slug = serializers.CharField(source='related_document.slug', read_only=True)
    
    # Linked Note
    related_note_title = serializers.CharField(source='related_note.title', read_only=True)
    related_note_slug = serializers.CharField(source='related_note.slug', read_only=True)

    # Linked Knowledge Vault
    related_knowledge_title = serializers.CharField(source='related_knowledge.title', read_only=True)
    related_knowledge_slug = serializers.CharField(source='related_knowledge.slug', read_only=True)

    # Linked Calendar Event
    related_calendar_event_title = serializers.CharField(source='related_calendar_event.title', read_only=True)

    # Linked Task
    related_task_title = serializers.CharField(source='related_task.title', read_only=True)

    # Folder
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    folder_slug = serializers.CharField(source='folder.slug', read_only=True)

    file_url = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True, required=False)
    title = serializers.CharField(required=False, max_length=255, allow_blank=True)

    class Meta:
        model = MediaAsset
        fields = [
            'id',
            'owner',
            'owner_email',
            'project',
            'project_slug',
            'project_title',
            'folder',
            'folder_name',
            'folder_slug',
            'related_document',
            'related_document_title',
            'related_document_slug',
            'related_note',
            'related_note_title',
            'related_note_slug',
            'related_knowledge',
            'related_knowledge_title',
            'related_knowledge_slug',
            'related_calendar_event',
            'related_calendar_event_title',
            'related_task',
            'related_task_title',
            'title',
            'slug',
            'asset_type',
            'description',
            'file_name',
            'mime_type',
            'file_size',
            'thumbnail_url',
            'storage_path',
            'file_url',
            'file',
            'favorite',
            'archived',
            'tags',
            'created_at',
            'updated_at',
            'last_opened_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'slug',
            'file_name',
            'mime_type',
            'file_size',
            'thumbnail_url',
            'storage_path',
            'created_at',
            'updated_at',
            'last_opened_at',
        ]

    def get_file_url(self, obj):
        if not obj.storage_path:
            return ""
        try:
            return get_storage_backend().get_url(obj.storage_path)
        except Exception:
            return ""

    def validate_title(self, value):
        if value and len(value) > 255:
            raise serializers.ValidationError("Title cannot exceed 255 characters")
        return value

    def validate_asset_type(self, value):
        valid_types = [choice[0] for choice in MediaAsset.ASSET_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid asset type. Must be one of {valid_types}")
        return value

    def validate(self, data):
        project = data.get("project")
        request = self.context.get("request")
        
        if project and request:
            if project.owner != request.user:
                raise serializers.ValidationError({"project": "Invalid project or you do not have permission."})

        # Validate folder
        folder = data.get("folder")
        if folder and request:
            if folder.owner != request.user:
                raise serializers.ValidationError({"folder": "Invalid folder or you do not have permission."})
            if project and folder.project != project:
                raise serializers.ValidationError({"folder": "Folder must belong to the selected project."})

        # Validate linked document
        related_document = data.get("related_document")
        if related_document and request:
            if related_document.owner != request.user:
                raise serializers.ValidationError({"related_document": "Invalid document or you do not have permission."})
            if project and related_document.project != project:
                raise serializers.ValidationError({"related_document": "Document must belong to the selected project."})

        # Validate linked note
        related_note = data.get("related_note")
        if related_note and request:
            if related_note.owner != request.user:
                raise serializers.ValidationError({"related_note": "Invalid note or you do not have permission."})
            if project and related_note.project != project:
                raise serializers.ValidationError({"related_note": "Note must belong to the selected project."})

        # Validate linked knowledge item
        related_knowledge = data.get("related_knowledge")
        if related_knowledge and request:
            if related_knowledge.owner != request.user:
                raise serializers.ValidationError({"related_knowledge": "Invalid knowledge item or you do not have permission."})
            if project and related_knowledge.project != project:
                raise serializers.ValidationError({"related_knowledge": "Knowledge item must belong to the selected project."})

        # Validate linked calendar event
        related_calendar_event = data.get("related_calendar_event")
        if related_calendar_event and request:
            if related_calendar_event.owner != request.user:
                raise serializers.ValidationError({"related_calendar_event": "Invalid calendar event or you do not have permission."})
            if project and related_calendar_event.project != project:
                raise serializers.ValidationError({"related_calendar_event": "Calendar event must belong to the selected project."})

        # Validate linked task
        related_task = data.get("related_task")
        if related_task and request:
            if related_task.owner != request.user:
                raise serializers.ValidationError({"related_task": "Invalid task or you do not have permission."})
            if project and related_task.project != project:
                raise serializers.ValidationError({"related_task": "Task must belong to the selected project."})

        return data
