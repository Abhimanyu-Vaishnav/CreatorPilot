from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.productivity.infrastructure.persistence.models import Project, Document, Note, KnowledgeItem, CalendarEvent, Task
from apps.creative.infrastructure.persistence.models import MediaAsset, MediaFolder
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import os

User = get_user_model()

class MediaLibraryAPITests(APITestCase):
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

        # Create linked entities for userA
        self.docA = Document.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Document A"
        )
        self.noteA = Note.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Note A"
        )
        self.knowledgeA = KnowledgeItem.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Knowledge A"
        )
        self.taskA = Task.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Task A"
        )
        self.eventA = CalendarEvent.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Event A",
            start_datetime="2026-07-10T12:00:00Z",
            end_datetime="2026-07-10T13:00:00Z",
            event_type="Task"
        )

    def test_media_folder_crud_endpoints(self):
        self.client.force_authenticate(user=self.userA)

        # 1. Create Folder
        create_url = reverse("folder-list")
        folder_data = {
            "project": self.projectA.id,
            "name": "Assets Directory"
        }
        response = self.client.post(create_url, folder_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Assets Directory")
        folder_slug = response.data["slug"]

        # Verify folder list
        response = self.client.get(create_url, {"project": self.projectA.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

        # 2. Owner isolation check: UserB shouldn't list UserA's folders
        self.client.force_authenticate(user=self.userB)
        response = self.client.get(create_url, {"project": self.projectA.id})
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

        # UserB trying to create folder in UserA's project -> Validation Error
        bad_folder_data = {
            "project": self.projectA.id,
            "name": "Hack Directory"
        }
        response = self.client.post(create_url, bad_folder_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_media_asset_upload_and_validation(self):
        self.client.force_authenticate(user=self.userA)

        # 1. Test size constraint and whitelist validation (e.g. bad extension)
        bad_file = SimpleUploadedFile("script.py", b"print('hack')", content_type="text/x-python")
        create_url = reverse("media-list")
        upload_data = {
            "project": self.projectA.id,
            "file": bad_file,
            "title": "Hack Script",
            "asset_type": "Other"
        }
        response = self.client.post(create_url, upload_data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Test successful upload with valid extension & MIME type
        good_file = SimpleUploadedFile("Promo Cover.jpg", b"fake_jpeg_content", content_type="image/jpeg")
        valid_upload_data = {
            "project": self.projectA.id,
            "file": good_file,
            "asset_type": "Image"
        }
        response = self.client.post(create_url, valid_upload_data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Promo_Cover.jpg")  # Normalized safe filename normalization
        self.assertEqual(response.data["file_name"], "Promo_Cover.jpg")
        asset_slug = response.data["slug"]

        # Verify Owner isolation on Detail endpoint
        self.client.force_authenticate(user=self.userB)
        detail_url = reverse("media-detail", kwargs={"slug": asset_slug})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_media_asset_linking_and_duplication(self):
        self.client.force_authenticate(user=self.userA)

        # Create assets
        file_obj = SimpleUploadedFile("doc.pdf", b"fake_pdf", content_type="application/pdf")
        asset = MediaAsset.objects.create(
            owner=self.userA,
            project=self.projectA,
            title="Contract Reference",
            asset_type="PDF",
            file_name="doc.pdf",
            mime_type="application/pdf",
            file_size=8,
            storage_path="media_library/doc.pdf"
        )

        detail_url = reverse("media-detail", kwargs={"slug": asset.slug})

        # 1. Test Linking entities
        link_data = {
            "related_document": self.docA.id,
            "related_note": self.noteA.id,
            "related_knowledge": self.knowledgeA.id,
            "related_task": self.taskA.id,
            "related_calendar_event": self.eventA.id
        }
        response = self.client.patch(detail_url, link_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["related_document_title"], "Document A")
        self.assertEqual(response.data["related_note_title"], "Note A")
        self.assertEqual(response.data["related_knowledge_title"], "Knowledge A")

        # 2. Test Asset Duplication details action
        dup_url = reverse("media-duplicate", kwargs={"slug": asset.slug})
        response = self.client.post(dup_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Contract Reference (Copy)")
        self.assertNotEqual(response.data["slug"], asset.slug)

    def test_media_asset_bulk_actions(self):
        self.client.force_authenticate(user=self.userA)

        # Create multiple assets
        asset1 = MediaAsset.objects.create(
            owner=self.userA, project=self.projectA, title="Asset 1",
            file_name="1.jpg", mime_type="image/jpeg", file_size=10, storage_path="media_library/1.jpg"
        )
        asset2 = MediaAsset.objects.create(
            owner=self.userA, project=self.projectA, title="Asset 2",
            file_name="2.jpg", mime_type="image/jpeg", file_size=10, storage_path="media_library/2.jpg"
        )

        slugs = [asset1.slug, asset2.slug]

        # 1. Bulk Favorite
        fav_url = reverse("media-bulk-favorite")
        response = self.client.post(fav_url, {"slugs": slugs, "favorite": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(MediaAsset.objects.get(id=asset1.id).favorite)

        # 2. Bulk Archive
        arch_url = reverse("media-bulk-archive")
        response = self.client.post(arch_url, {"slugs": slugs}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(MediaAsset.objects.get(id=asset1.id).archived)

        # 3. Bulk Restore
        rest_url = reverse("media-bulk-restore")
        response = self.client.post(rest_url, {"slugs": slugs}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(MediaAsset.objects.get(id=asset1.id).archived)

        # 4. Bulk Delete
        del_url = reverse("media-bulk-delete")
        response = self.client.post(del_url, {"slugs": slugs}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MediaAsset.objects.filter(id__in=[asset1.id, asset2.id]).count(), 0)
