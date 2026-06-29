from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from ..infrastructure.persistence.models import Project
from .serializers import ProjectSerializer

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
        serializer.save(
            owner=self.request.user,
            last_opened_at=timezone.now()
        )
