import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.productivity.infrastructure.persistence.models import Project, Document
from apps.creative.infrastructure.persistence.models import MediaAsset

class PublishPlatform(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default="Globe")
    color = models.CharField(max_length=50, default="#6366f1")
    enabled = models.BooleanField(default=True)
    api_capability = models.BooleanField(default=False)
    scheduling_capability = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class PublishItem(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("In Review", "In Review"),
        ("Approved", "Approved"),
        ("Scheduled", "Scheduled"),
        ("Publishing", "Publishing"),
        ("Published", "Published"),
        ("Failed", "Failed"),
        ("Archived", "Archived"),
    ]

    APPROVAL_STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="publishing_items"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="publishing_items"
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="publishing_items"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    platform = models.ForeignKey(
        PublishPlatform,
        on_delete=models.PROTECT,
        related_name="publishing_items"
    )
    content_type = models.CharField(max_length=100, default="Generic Content")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")
    excerpt = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    featured_media = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="publishing_items_featured"
    )
    additional_media = models.ManyToManyField(
        MediaAsset,
        blank=True,
        related_name="publishing_items_additional"
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=100, default="UTC")
    approval_status = models.CharField(
        max_length=50,
        choices=APPROVAL_STATUS_CHOICES,
        default="Pending"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_publishing_items"
    )
    notes = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    canonical_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Future-proofing integration fields
    external_post_id = models.CharField(max_length=255, blank=True, null=True)
    publish_url = models.URLField(max_length=500, blank=True, null=True)
    platform_response = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True, default="")
    retry_count = models.IntegerField(default=0)
    last_sync_at = models.DateTimeField(blank=True, null=True)
    analytics_synced = models.BooleanField(default=False)
    automation_triggered = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "publish-item"
            self.slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.platform.name})"

class PublishHistory(models.Model):
    publish_item = models.ForeignKey(
        PublishItem,
        on_delete=models.CASCADE,
        related_name="history"
    )
    action = models.CharField(max_length=100)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} on {self.publish_item.title} at {self.created_at}"
