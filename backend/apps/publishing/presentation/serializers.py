from rest_framework import serializers
from ..infrastructure.persistence.models import PublishPlatform, PublishItem, PublishHistory
from apps.productivity.infrastructure.persistence.models import Project, Document
from apps.creative.infrastructure.persistence.models import MediaAsset

class PublishPlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublishPlatform
        fields = [
            'id',
            'name',
            'icon',
            'color',
            'enabled',
            'api_capability',
            'scheduling_capability',
            'created_at',
            'updated_at',
        ]

class PublishHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)

    class Meta:
        model = PublishHistory
        fields = [
            'id',
            'publish_item',
            'action',
            'performed_by',
            'performed_by_name',
            'performed_by_email',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class PublishItemSerializer(serializers.ModelSerializer):
    platform_details = PublishPlatformSerializer(source='platform', read_only=True)
    project_slug = serializers.CharField(source='project.slug', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    document_slug = serializers.CharField(source='document.slug', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)

    # Media assets details
    featured_media_details = serializers.SerializerMethodField()
    additional_media_details = serializers.SerializerMethodField()
    history = PublishHistorySerializer(many=True, read_only=True)

    class Meta:
        model = PublishItem
        fields = [
            'id',
            'owner',
            'owner_username',
            'project',
            'project_slug',
            'project_title',
            'document',
            'document_slug',
            'document_title',
            'title',
            'slug',
            'platform',
            'platform_details',
            'content_type',
            'status',
            'excerpt',
            'content',
            'featured_media',
            'featured_media_details',
            'additional_media',
            'additional_media_details',
            'scheduled_at',
            'published_at',
            'timezone',
            'approval_status',
            'reviewer',
            'reviewer_username',
            'notes',
            'tags',
            'seo_title',
            'seo_description',
            'canonical_url',
            'external_post_id',
            'publish_url',
            'platform_response',
            'failure_reason',
            'retry_count',
            'last_sync_at',
            'analytics_synced',
            'automation_triggered',
            'history',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'slug',
            'owner',
            'created_at',
            'updated_at',
            'published_at',
        ]

    def get_featured_media_details(self, obj):
        if obj.featured_media:
            from apps.creative.presentation.serializers import MediaAssetSerializer
            return MediaAssetSerializer(obj.featured_media, context=self.context).data
        return None

    def get_additional_media_details(self, obj):
        if obj.additional_media.exists():
            from apps.creative.presentation.serializers import MediaAssetSerializer
            return MediaAssetSerializer(obj.additional_media.all(), many=True, context=self.context).data
        return []

    def validate(self, data):
        request = self.context.get("request")
        if not request:
            return data

        # Validate owner on project
        project = data.get("project")
        if project and project.owner != request.user:
            raise serializers.ValidationError({"project": "You do not have access to this project."})

        # Validate owner on document
        document = data.get("document")
        if document and document.owner != request.user:
            raise serializers.ValidationError({"document": "You do not have access to this document."})

        # Validate owner on featured media
        featured_media = data.get("featured_media")
        if featured_media and featured_media.owner != request.user:
            raise serializers.ValidationError({"featured_media": "You do not have access to this media asset."})

        # Validate owner on additional media
        additional_media = data.get("additional_media")
        if additional_media:
            for media in additional_media:
                if media.owner != request.user:
                    raise serializers.ValidationError({"additional_media": "One or more media assets are invalid."})

        return data
