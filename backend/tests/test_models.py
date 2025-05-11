from django.test import TestCase
from users.models import CustomUser


class CustomUserModelTestCase(TestCase):
    def test_create_user(self):
        """Test creating a regular user"""
        user = CustomUser.objects.create_user(
            username="regularuser", email="user@example.com", password="userpassword123"
        )

        self.assertEqual(user.username, "regularuser")
        self.assertEqual(user.email, "user@example.com")
        self.assertTrue(user.check_password("userpassword123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_is_admin_method(self):
        """Test the is_admin method on CustomUser"""
        regular_user = CustomUser.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="password123",
            role="user",
        )

        admin_user = CustomUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password123",
            role="admin",
        )

        staff_user = CustomUser.objects.create_user(
            username="staff",
            email="staff@example.com",
            password="password123",
            is_staff=True,
        )

        self.assertFalse(regular_user.is_admin())
        self.assertTrue(admin_user.is_admin())
        # Check superuser is also considered admin
        self.assertFalse(staff_user.is_admin())
