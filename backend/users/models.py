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
        return self.role == "admin" or self.is_superuser or self.is_staff

    def is_user(self):
        return self.role == "user"
