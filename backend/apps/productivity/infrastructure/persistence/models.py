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
            
            # Append owner's user ID if available
            owner_id = self.owner.id if (self.owner and self.owner.id) else None
            if owner_id:
                slug = f"{base_slug}-{owner_id}"
            else:
                slug = base_slug

            counter = 1
            # Ensure slug is unique globally
            while Project.objects.filter(slug=slug).exclude(id=self.id).exists():
                if owner_id:
                    slug = f"{base_slug}-{counter}-{owner_id}"
                else:
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
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Published", "Published"),
    ]

    color = models.CharField(max_length=50, default="#6366f1")
    template = models.CharField(max_length=50, default="Blank")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")
    last_opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-pinned", "-favorite", "-updated_at"]

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        import re

        # Validation
        if not self.title or not self.title.strip():
            raise ValidationError("Title cannot be empty")
        if len(self.title) > 100:
            raise ValidationError("Title cannot exceed 100 characters")

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
        else:
            if not re.match(r"^[a-z0-9-_]+$", self.slug):
                raise ValidationError("Invalid slug format. Slugs can only contain lowercase letters, numbers, hyphens, and underscores.")

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


class KnowledgeItem(models.Model):
    TYPE_CHOICES = [
        ("Research Note", "Research Note"),
        ("Website", "Website"),
        ("PDF", "PDF"),
        ("Image", "Image"),
        ("Video Link", "Video Link"),
        ("Book", "Book"),
        ("Tutorial", "Tutorial"),
        ("Checklist", "Checklist"),
        ("Snippet", "Snippet"),
        ("Document", "Document"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="knowledge_items"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="knowledge_items"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default="Document")
    source_url = models.URLField(blank=True, null=True)
    file_path = models.CharField(max_length=500, blank=True, default="")
    note_reference = models.ForeignKey(
        Note,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="knowledge_items"
    )
    tags = models.JSONField(default=list, blank=True)
    favorite = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-pinned", "-favorite", "-updated_at"]

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        import re

        if not self.title or not self.title.strip():
            raise ValidationError("Title cannot be empty")

        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "knowledge"
            
            slug = base_slug
            counter = 1
            while KnowledgeItem.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        else:
            if not re.match(r"^[a-z0-9-_]+$", self.slug):
                raise ValidationError("Invalid slug format. Slugs can only contain lowercase letters, numbers, hyphens, and underscores.")

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Task(models.Model):
    STATUS_CHOICES = [
        ("Todo", "Todo"),
        ("In Progress", "In Progress"),
        ("Blocked", "Blocked"),
        ("Completed", "Completed"),
    ]

    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Urgent", "Urgent"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    related_note = models.ForeignKey(
        Note,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )
    related_knowledge = models.ForeignKey(
        KnowledgeItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Todo")
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES, default="Medium")
    due_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    estimated_time = models.IntegerField(default=0)  # minutes
    completed_at = models.DateTimeField(null=True, blank=True)
    favorite = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    position = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]

    def save(self, *args, **kwargs):
        if self.status == "Completed" and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        elif self.status != "Completed" and self.completed_at:
            self.completed_at = None

        super().save(*args, **kwargs)
        self.update_project_progress()

    def delete(self, *args, **kwargs):
        project = self.project
        super().delete(*args, **kwargs)
        Task.update_project_progress_for_project(project)

    def update_project_progress(self):
        Task.update_project_progress_for_project(self.project)

    @staticmethod
    def update_project_progress_for_project(project):
        total_tasks = Task.objects.filter(project=project, archived=False).count()
        if total_tasks > 0:
            completed_tasks = Task.objects.filter(project=project, archived=False, status="Completed").count()
            progress = int((completed_tasks / total_tasks) * 100)
        else:
            progress = 0
        
        if project.project_progress != progress:
            project.project_progress = progress
            project.save(update_fields=["project_progress"])

    def __str__(self):
        return self.title


class CalendarEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ("Task", "Task"),
        ("Milestone", "Milestone"),
        ("Meeting", "Meeting"),
        ("Content Plan", "Content Plan"),
        ("Reminder", "Reminder"),
        ("Personal", "Personal"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_events"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="calendar_events"
    )
    related_task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_events"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=50, default="#6366f1")
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES, default="Content Plan")
    reminder_minutes = models.IntegerField(default=0)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_datetime"]

    def __str__(self):
        return self.title


class Document(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Review", "Review"),
        ("Published", "Published"),
    ]
    
    VISIBILITY_CHOICES = [
        ("Private", "Private"),
        ("Workspace", "Workspace"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default="")
    excerpt = models.TextField(blank=True, default="")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES, default="Private")
    cover_image = models.CharField(max_length=500, blank=True, default="")
    template = models.CharField(max_length=50, default="Blank")
    archived = models.BooleanField(default=False)
    word_count = models.IntegerField(default=0)
    reading_time = models.IntegerField(default=0)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        import re

        # Validation
        if not self.title or not self.title.strip():
            raise ValidationError("Title cannot be empty")
        if len(self.title) > 100:
            raise ValidationError("Title cannot exceed 100 characters")

        # Initialize template content if empty and template is set
        if not self.content and self.template and self.template != "Blank":
            templates = {
                "Blog Article": "# Blog Article: [Title]\n\n## Executive Summary\n- **Target Audience**:\n- **SEO Keywords**:\n- **Key Takeaways**:\n\n## Introduction\n\n## Core Section 1\n\n## Core Section 2\n\n## Conclusion & CTA",
                "YouTube Script": "# YouTube Script: [Topic]\n\n- **Target Duration**: \n- **Key Value Prop**: \n\n## Hook (0:00 - 0:30)\n\n## Intro (0:30 - 1:00)\n\n## Main Body (1:00 - 8:00)\n- **Point 1**:\n- **Point 2**:\n- **Point 3**:\n\n## Outro & CTA (8:00 - 9:00)",
                "Pinterest Pin Copy": "# Pinterest Pin Copy\n\n- **Target Board**: \n- **Visual Concept**: \n\n## Board Title Suggestions\n- \n\n## Description Suggestions\n- \n\n## Destination URL\n- \n\n## Relevant Hashtags\n- ",
                "Newsletter": "# Newsletter Issue\n\n- **Subject Line**: \n- **Preview Text**: \n- **Sent Date**: \n\n## Introduction\n\n## Main Story\n\n## Industry News / Updates\n- \n\n## Call to Action",
                "Course Outline": "# Course Outline: [Course Name]\n\n- **Target Student**: \n- **Prerequisites**: \n\n## Module 1: Introduction\n- **Lesson 1.1**:\n- **Lesson 1.2**:\n\n## Module 2: Core Concepts\n- **Lesson 2.1**:\n- **Lesson 2.2**:\n\n## Module 3: Hands-on Practice\n- **Lesson 3.1**:\n- **Lesson 3.2**:\n\n## Conclusion",
                "Podcast Outline": "# Podcast Outline: [Episode Name]\n\n- **Episode Number**: \n- **Guest**: \n- **Sponsor Message**: \n\n## Introduction & Hook\n\n## Segment 1: Discussion\n\n## Segment 2: Deep Dive\n\n## Wrap-up & Outro",
            }
            self.content = templates.get(self.template, "")

        # Generate slug if empty
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = "document"
            slug = base_slug
            counter = 1
            while Document.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        else:
            if not re.match(r"^[a-z0-9-_]+$", self.slug):
                raise ValidationError("Invalid slug format. Slugs can only contain lowercase letters, numbers, hyphens, and underscores.")

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






