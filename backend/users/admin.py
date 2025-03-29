# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Additional info", {"fields": ("role",)}),
    )
    list_display = ("username", "email", "role", "is_staff", "is_superuser")

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and obj.is_superuser:
            raise ValueError("Only a superuser can promote admins!")
        super().save_model(request, obj, form, change)

admin.site.register(CustomUser, CustomUserAdmin)
