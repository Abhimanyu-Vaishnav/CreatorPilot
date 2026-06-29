from rest_framework import serializers
from ..infrastructure.persistence.models import Project

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
