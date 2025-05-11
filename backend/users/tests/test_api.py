from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import CustomUser


class UserAPITestCase(TestCase):
    def setUp(self):
        # Create test users
        self.user = CustomUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            role="user",
        )

        self.admin_user = CustomUser.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpassword123",
            role="admin",
        )

        # Initialize API client
        self.client = APIClient()

    def test_user_model_basics(self):
        """Test basic functionality of the CustomUser model"""
        user = CustomUser.objects.get(username="testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.role, "user")
        self.assertFalse(user.is_admin())

        admin = CustomUser.objects.get(username="adminuser")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_admin())
