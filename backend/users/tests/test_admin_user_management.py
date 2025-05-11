from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import CustomUser


class AdminUserManagementTestCase(TestCase):
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

    def test_admin_users_list(self):
        """Test admin users list view"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Access users list
        response = self.client.get(reverse("admin-users-list"))

        # Check basic response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Parse the JSON response
        data = response.json()

        # Check that users are in the response
        self.assertIn("users", data)

        # Check correct number of users
        self.assertEqual(len(data["users"]), 3)

    def test_admin_create_user(self):
        """Test admin creating a new user"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Define data for new user
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password1": "newpassword123",
            "password2": "newpassword123",
            "role": "user",
            "is_active": True,
        }

        # Submit form to create user
        response = self.client.post(reverse("admin-create-user"), data, follow=True)

        # Check redirect and success message
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that user was created
        self.assertTrue(CustomUser.objects.filter(username="newuser").exists())

        # Check user attributes
        new_user = CustomUser.objects.get(username="newuser")
        self.assertEqual(new_user.email, "newuser@example.com")
        self.assertEqual(new_user.role, "user")
        self.assertTrue(new_user.is_active)

    def test_admin_delete_user(self):
        """Test admin deleting a user"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Delete regular user
        response = self.client.post(
            reverse("admin-delete-user", kwargs={"user_id": self.regular_user1.id}),
            follow=True,
        )

        # Check redirect and success message
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that user was deleted
        self.assertFalse(CustomUser.objects.filter(username="user1").exists())

    def test_admin_bulk_actions(self):
        """Test admin bulk actions on users"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Create a few more test users
        for i in range(3, 6):
            CustomUser.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="password123",
                role="user",
            )

        # Deactivate multiple users
        data = {
            "users": [self.regular_user1.id, self.regular_user2.id],
            "action": "deactivate",
        }

        response = self.client.post(reverse("admin-bulk-actions"), data, follow=True)

        # Check redirect and success message
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that users were deactivated
        self.regular_user1.refresh_from_db()
        self.regular_user2.refresh_from_db()
        self.assertFalse(self.regular_user1.is_active)
        self.assertFalse(self.regular_user2.is_active)

    def test_non_admin_user_management_forbidden(self):
        """Test that non-admin users can't perform user management actions"""
        # Login as regular user
        self.client.force_login(self.regular_user1)

        # Try to access users list
        response = self.client.get(reverse("admin-users-list"))
        self.assertIn(response.status_code, [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN])

        # Try to create a user
        response = self.client.get(reverse("admin-create-user"))
        self.assertIn(response.status_code, [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN])

        # Try to delete a user
        response = self.client.post(
            reverse("admin-delete-user", kwargs={"user_id": self.regular_user2.id})
        )
        self.assertIn(response.status_code, [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN])

        # Check that user was not deleted
        self.assertTrue(CustomUser.objects.filter(username="user2").exists())
