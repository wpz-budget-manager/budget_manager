from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Administrator"),
        ("user", "User"),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")

    def is_admin(self):
        return self.role == "admin" or self.is_superuser

    def is_user(self):
        return self.role == "user"


class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Transaction(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.amount} - {self.category}"
