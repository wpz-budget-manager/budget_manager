from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from users.models import CustomUser, Category, Transaction
from datetime import date


class TransactionCategoryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(username="user", password="test123")
        self.client.force_login(self.user)

        self.category = Category.objects.create(name="Test Category", user=self.user)

    def test_create_transaction(self):
        data = {
            "amount": "123.45",
            "description": "Test transaction",
            "date": date.today().isoformat(),
            "category_id": self.category.id,
        }
        response = self.client.post("/api/transactions/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)
        tx = Transaction.objects.first()
        self.assertEqual(tx.user, self.user)
        self.assertEqual(tx.category.name, "Test Category")

    def test_list_transactions_only_for_logged_user(self):
        other_user = CustomUser.objects.create_user(username="other", password="abc123")
        Transaction.objects.create(user=other_user, amount=100, date=date.today())

        response = self.client.get("/api/transactions/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 0)

    def test_create_custom_category(self):
        response = self.client.post("/api/categories/", {"name": "Custom"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Category.objects.filter(name="Custom", user=self.user).exists())

    def test_list_categories_only_for_user(self):
        Category.objects.create(name="Other's", user=None)
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, 200)
        for cat in response.data["results"]:
            self.assertEqual(cat["user"], self.user.id)
