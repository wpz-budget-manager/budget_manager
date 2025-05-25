from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    register,
    admin_dashboard,
    login_view,
    get_csrf_token,
    api_register_view,
    api_login_view,
    api_logout_view,
    user_info,
)

urlpatterns = [
    # Traditional Django views for browser-based usage
    path("register/", register, name="register"),
    path("login/", login_view, name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="/"), name="logout"),
    path("admin-dashboard/", admin_dashboard, name="admin-dashboard"),
    # API endpoints for React frontend
    path("api/csrf/", get_csrf_token, name="csrf"),
    path("api/register/", api_register_view, name="api_register"),
    path("api/login/", api_login_view, name="api_login"),
    path("api/logout/", api_logout_view, name="api_logout"),
    path("api/user/", user_info, name="user_info"),
]
