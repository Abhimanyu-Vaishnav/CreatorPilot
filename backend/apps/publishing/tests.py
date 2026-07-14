from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.productivity.infrastructure.persistence.models import Project, Document, CalendarEvent
from apps.creative.infrastructure.persistence.models import MediaAsset
from apps.publishing.infrastructure.persistence.models import PublishPlatform, PublishItem, PublishHistory
from django.utils import timezone

User = get_user_model()

class PublishingAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.userA = User.objects.create_user(
            email="userA@example.com", password="password123"
        )
        self.userB = User.objects.create_user(
            email="userB@example.com", password="password123"
        )

        # Create project for userA
        self.projectA = Project.objects.create(
            owner=self.userA,
            title="User A Project",
            category="General",
            status="Planning"
        )

        # Create project for userB
        self.projectB = Project.objects.create(
            owner=self.userB,
            title="User B Project",
            category="General",
            status="Planning"
        )

        # Create document for userA
        self.docA = Document.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Document A"
        )

        # Platforms are seeded via migration, let's fetch one or get_or_create to make sure
        self.platform, _ = PublishPlatform.objects.get_or_create(
            name="YouTube Video",
            defaults={"icon": "Youtube", "color": "#ef4444"}
        )

    def test_publishing_crud_endpoints(self):
        self.client.force_authenticate(user=self.userA)

        # 1. Create PublishItem
        create_url = reverse("publishing-list")
        item_data = {
            "project": self.projectA.id,
            "document": self.docA.id,
            "title": "Unboxing Video",
            "platform": self.platform.id,
            "content_type": "YouTube Video",
            "content": "Hey guys today we are unboxing...",
            "timezone": "UTC"
        }
        response = self.client.post(create_url, item_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Unboxing Video")
        self.assertEqual(response.data["status"], "Draft")
        slug = response.data["slug"]

        # Verify list shows the item
        response = self.client.get(create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

        # 2. Retrieve details
        detail_url = reverse("publishing-detail", kwargs={"slug": slug})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Unboxing Video")

        # 3. Update PublishItem
        update_data = {
            "title": "Awesome Unboxing Video",
            "project": self.projectA.id,
            "platform": self.platform.id
        }
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Awesome Unboxing Video")

        # 4. History log check
        history_url = detail_url
        response = self.client.get(history_url)
        self.assertTrue(len(response.data["history"]) >= 2) # Created and Updated

    def test_owner_isolation(self):
        # UserA creates a publish item
        item = PublishItem.objects.create(
            owner=self.userA,
            project=self.projectA,
            document=self.docA,
            title="User A Secret Post",
            platform=self.platform,
            status="Draft"
        )

        # Authenticate UserB
        self.client.force_authenticate(user=self.userB)

        # UserB tries to access UserA's item -> Should be 404
        detail_url = reverse("publishing-detail", kwargs={"slug": item.slug})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # UserB tries to create publish item in UserA's project -> Should fail validation
        create_url = reverse("publishing-list")
        bad_data = {
            "project": self.projectA.id,
            "title": "Hacked Post",
            "platform": self.platform.id
        }
        response = self.client.post(create_url, bad_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_workflow_actions(self):
        self.client.force_authenticate(user=self.userA)

        # Create item
        item = PublishItem.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Workflow Test",
            platform=self.platform,
            status="Draft"
        )
        detail_url = reverse("publishing-detail", kwargs={"slug": item.slug})

        # 1. Approve action
        approve_url = f"{detail_url}approve/"
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approval_status"], "Approved")

        # 2. Reject action
        reject_url = f"{detail_url}reject/"
        response = self.client.post(reject_url, {"notes": "Wrong caption length"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approval_status"], "Rejected")
        self.assertEqual(response.data["status"], "Draft")

        # 3. Schedule action
        schedule_url = f"{detail_url}schedule/"
        sched_time = (timezone.now() + timezone.timedelta(days=2)).isoformat()
        response = self.client.post(schedule_url, {"scheduled_at": sched_time, "timezone": "EST"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Scheduled")
        
        # Verify CalendarEvent was created
        cal_events = CalendarEvent.objects.filter(related_publish_item_id=item.id)
        self.assertEqual(cal_events.count(), 1)
        self.assertEqual(cal_events.first().title, f"[YouTube Video] Workflow Test")

        # 4. Publish action
        publish_url = f"{detail_url}publish/"
        response = self.client.post(publish_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Published")
        self.assertIsNotNone(response.data["published_at"])

        # Verify CalendarEvent title updated
        self.assertEqual(CalendarEvent.objects.filter(related_publish_item_id=item.id).first().title, f"[PUBLISHED] Workflow Test")

        # 5. Duplicate action
        duplicate_url = f"{detail_url}duplicate/"
        response = self.client.post(duplicate_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Workflow Test Copy")
        self.assertEqual(response.data["status"], "Draft")
