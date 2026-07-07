from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.productivity.infrastructure.persistence.models import Project, Document, ProjectActivity

User = get_user_model()

class DocumentAPITests(APITestCase):
    def setUp(self):
        # Create users using email as the identifier
        self.user1 = User.objects.create_user(
            email="user1@example.com", password="password123"
        )
        self.user2 = User.objects.create_user(
            email="user2@example.com", password="password123"
        )

        # Create project for user1
        self.project1 = Project.objects.create(
            owner=self.user1,
            title="User 1 Project",
            category="General",
            status="Planning"
        )

        # Create project for user2
        self.project2 = Project.objects.create(
            owner=self.user2,
            title="User 2 Project",
            category="General",
            status="Planning"
        )

        # Base document input
        self.doc_data = {
            "project": self.project1.id,
            "title": "My Blog Draft",
            "content": "# Blog Draft content\nSome text.",
            "status": "Draft",
            "visibility": "Private",
            "template": "Blog Article"
        }

    def test_document_crud_endpoints(self):
        # Authenticate user1
        self.client.force_authenticate(user=self.user1)

        # 1. Create Document
        create_url = reverse("document-list")
        response = self.client.post(create_url, self.doc_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "My Blog Draft")
        self.assertEqual(response.data["template"], "Blog Article")
        self.assertEqual(response.data["word_count"], 6)  # "# Blog Draft content\nSome text." has 6 elements in split()
        slug = response.data["slug"]

        # Check that ProjectActivity has been recorded
        activity = ProjectActivity.objects.filter(project=self.project1, action="Document Created").first()
        self.assertIsNotNone(activity)
        self.assertEqual(activity.metadata["document_slug"], slug)

        # 2. Get Document list
        list_url = reverse("document-list")
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

        # 3. Retrieve Document
        detail_url = reverse("document-detail", kwargs={"slug": slug})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "My Blog Draft")

        # Check Document Opened activity
        activity_open = ProjectActivity.objects.filter(project=self.project1, action="Document Opened").first()
        self.assertIsNotNone(activity_open)

        # 4. Update Document
        update_data = {
            "title": "My Updated Blog Draft",
            "content": "# Updated Header\nThis has a list:\n- item 1\n- item 2"
        }
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "My Updated Blog Draft")
        self.assertEqual(response.data["word_count"], 13)  # 13 elements in split()

        # 5. Delete Document
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify deletion
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Check Document Deleted activity
        activity_del = ProjectActivity.objects.filter(project=self.project1, action="Document Deleted").first()
        self.assertIsNotNone(activity_del)

    def test_owner_isolation_and_security(self):
        # Authenticate user1 and create a document
        self.client.force_authenticate(user=self.user1)
        create_url = reverse("document-list")
        response = self.client.post(create_url, self.doc_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        slug = response.data["slug"]

        # Authenticate user2
        self.client.force_authenticate(user=self.user2)

        # User2 tries to get User1's document -> should return 404
        detail_url = reverse("document-detail", kwargs={"slug": slug})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # User2 tries to list documents -> should return 0 items
        list_url = reverse("document-list")
        response = self.client.get(list_url)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

        # User2 tries to post a document under User1's project -> should fail validation
        bad_doc_data = {
            "project": self.project1.id,  # User1's project
            "title": "Hacker Draft",
            "content": "Intrusive text"
        }
        response = self.client.post(create_url, bad_doc_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("project", response.data)

    def test_document_archive_and_duplicate(self):
        self.client.force_authenticate(user=self.user1)

        # 1. Create a document
        create_url = reverse("document-list")
        response = self.client.post(create_url, self.doc_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        slug = response.data["slug"]

        # 2. Archive the document via PATCH
        detail_url = reverse("document-detail", kwargs={"slug": slug})
        response = self.client.patch(detail_url, {"archived": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["archived"])

        # Check project activity timeline log
        activity_arch = ProjectActivity.objects.filter(project=self.project1, action="Document Archived").first()
        self.assertIsNotNone(activity_arch)

        # 3. Querying list without archived should return 0 documents
        response = self.client.get(create_url)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

        # Querying list with archived=true should return 1 document
        response = self.client.get(create_url + "?archived=true")
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

        # Restore the document
        response = self.client.patch(detail_url, {"archived": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["archived"])

        # Check project activity timeline log for restored
        activity_rest = ProjectActivity.objects.filter(project=self.project1, action="Document Restored").first()
        self.assertIsNotNone(activity_rest)
