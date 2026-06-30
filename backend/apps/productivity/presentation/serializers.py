from rest_framework import serializers
from ..infrastructure.persistence.models import Project, ProjectActivity

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

