from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import CustomUser


class AdminDashboardTestCase(TestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = CustomUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpassword123",
            role="admin",
        )

        # Create regular users
        self.regular_user1 = CustomUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="password123",
            role="user",
        )

        self.regular_user2 = CustomUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="password123",
            role="user",
        )

        # Initialize API client
        self.client = APIClient()

    def test_admin_dashboard_stats(self):
        """Test admin dashboard statistics"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Access admin dashboard
        response = self.client.get(reverse("admin-dashboard"))

        # Check basic response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Parse the JSON response
        data = response.json()

        # Check that stats contain expected fields
        self.assertIn("users_count", data)
        self.assertIn("active_users", data)
        self.assertIn("admin_users", data)
        self.assertIn("regular_users", data)

        # Check stats values
        self.assertEqual(data["users_count"], 3)  # 3 users total
        self.assertEqual(data["admin_users"], 1)  # 1 admin user
        self.assertEqual(data["regular_users"], 2)  # 2 regular users

    def test_admin_user_statistics(self):
        """Test admin user statistics API"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Get statistics
        response = self.client.get(reverse("admin-user-statistics"))

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that stats contain expected fields
        data = response.json()
        self.assertIn("total_users", data)
        self.assertIn("active_users", data)
        self.assertIn("admin_users", data)
        self.assertIn("regular_users", data)
        self.assertIn("users_by_month", data)

        # Check stats values
        self.assertEqual(data["total_users"], 3)  # 3 users total
        self.assertEqual(data["admin_users"], 1)  # 1 admin user
        self.assertEqual(data["regular_users"], 2)  # 2 regular users

    def test_non_admin_access_forbidden(self):
        """Test that non-admin users can't access admin pages"""
        # Login as regular user
        self.client.force_login(self.regular_user1)

        # Try to access admin dashboard
        response = self.client.get(reverse("admin-dashboard"))
        # Django redirects to login or returns 403
        self.assertIn(response.status_code, [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN])

        # Try to access statistics
        response = self.client.get(reverse("admin-user-statistics"))
        self.assertIn(response.status_code, [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN])
