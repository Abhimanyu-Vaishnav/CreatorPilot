from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Project(models.Model):
    STATUS_CHOICES = [
        ("Planning", "Planning"),
        ("In Progress", "In Progress"),
        ("Completed", "Completed"),
        ("Paused", "Paused"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=100, default="General")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Planning")
    color = models.CharField(max_length=50, default="#6366f1")
    icon = models.CharField(max_length=50, default="Folder")
    template = models.CharField(max_length=50, default="Blank")
    favorite = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            # Generate initial slug from title
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "project"
            slug = base_slug
            counter = 1
            # Ensure slug is unique globally
            while Project.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
