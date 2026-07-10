from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.productivity.infrastructure.persistence.models import Project, Document, Note, KnowledgeItem, CalendarEvent, Task
from ...application.storage import get_storage_backend

class MediaFolder(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="media_folders"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="media_folders"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subfolders"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("project", "parent", "name")

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            if not base_slug:
                base_slug = "folder"
            slug = base_slug
            counter = 1
            while MediaFolder.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class MediaAsset(models.Model):
    ASSET_TYPE_CHOICES = [
        ("Image", "Image"),
        ("Video", "Video"),
        ("Audio", "Audio"),
        ("PDF", "PDF"),
        ("Logo", "Logo"),
        ("Thumbnail", "Thumbnail"),
        ("Document", "Document"),
        ("Other", "Other"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="media_assets"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="media_assets"
    )
    folder = models.ForeignKey(
        MediaFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    related_document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    related_note = models.ForeignKey(
        Note,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    related_knowledge = models.ForeignKey(
        KnowledgeItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    related_calendar_event = models.ForeignKey(
        CalendarEvent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    related_task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES, default="Other")
    description = models.TextField(blank=True, default="")
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    thumbnail_url = models.CharField(max_length=500, blank=True, default="")
    storage_path = models.CharField(max_length=500)
    favorite = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            # Generate initial slug from title
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "media"
            
            slug = base_slug
            counter = 1
            # Ensure slug is unique globally
            while MediaAsset.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete physical file from storage when the DB record is deleted
        try:
            storage_backend = get_storage_backend()
            storage_backend.delete(self.storage_path)
        except Exception as e:
            # Log error or suppress if storage cleanup fails during DB cascade deletion
            pass
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.title
