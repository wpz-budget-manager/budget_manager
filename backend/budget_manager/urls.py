"""
URL configuration for budget_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.api import UserViewSet, bulk_actions, user_statistics

# Set up the API router
router = DefaultRouter()
router.register(r"users", UserViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("users/", include("users.urls")),
    # API endpoints
    path("api/", include(router.urls)),
    path("api/users/bulk-actions/", bulk_actions, name="api-user-bulk-actions"),
    path("api/users/statistics/", user_statistics, name="api-user-statistics"),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]
