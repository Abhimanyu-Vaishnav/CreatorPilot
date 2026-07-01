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
    project_progress = models.IntegerField(default=0)
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


class ProjectActivity(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_activities"
    )
    action = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.action} on {self.project.title}"


class Note(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default="")
    excerpt = models.TextField(blank=True, default="")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    favorite = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    word_count = models.IntegerField(default=0)
    reading_time = models.IntegerField(default=0)
    color = models.CharField(max_length=50, default="#6366f1")
    template = models.CharField(max_length=50, default="Blank")
    last_opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-pinned", "-favorite", "-updated_at"]

    def save(self, *args, **kwargs):
        # Initialize template content if empty and template is set
        if not self.content and self.template and self.template != "Blank":
            templates = {
                "Meeting Notes": "# Meeting Notes\n\n**Date**: \n**Attendees**: \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Action Items\n- [ ] ",
                "Research": "# Research Notes\n\n## Objectives\n- \n\n## Key Findings\n- \n\n## Sources\n- \n\n## Next Steps\n- ",
                "Blog Draft": "# Blog Draft\n\n**SEO Keywords**: \n**Target Audience**: \n\n## Introduction\n\n## Body Sections\n\n## Conclusion",
                "YouTube Script": "# YouTube Script\n\n**Target Duration**: \n**Hook**: \n\n## Outline\n- \n\n## Detailed Script\n- ",
                "Pinterest Ideas": "# Pinterest Ideas\n\n**Keywords**: \n**Visual Theme**: \n\n## Pin Board Drafts\n- ",
                "Checklist": "# Checklist\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3",
            }
            self.content = templates.get(self.template, "")

        # Generate slug if empty
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "note"
            slug = base_slug
            counter = 1
            while Note.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # Calculate statistics
        words = len(self.content.split())
        self.word_count = words
        self.reading_time = max(1, (words + 199) // 200) if words > 0 else 0
        
        # Calculate excerpt from content
        clean_content = self.content.replace("#", "").replace("*", "").replace("-", "").strip()
        self.excerpt = clean_content[:150] + "..." if len(clean_content) > 150 else clean_content

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


