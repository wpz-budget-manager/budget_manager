from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth import views as auth_views
from .views import (
    register,
    admin_dashboard,
    admin_users_list,
    admin_create_user,
    admin_delete_user,
    admin_bulk_actions,
    admin_user_statistics,
    login_view,
    get_csrf_token,
    api_register_view,
    api_login_view,
    api_logout_view,
    user_info,
    TransactionViewSet,
    CategoryViewSet,
)

router = DefaultRouter()
router.register(r"transactions", TransactionViewSet)
router.register(r"categories", CategoryViewSet)

urlpatterns = [
    # Traditional Django views for browser-based usage
    path("register/", register, name="register"),
    path("login/", login_view, name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="/"), name="logout"),
    # Admin URLs
    path("admin-dashboard/", admin_dashboard, name="admin-dashboard"),
    path("admin/users/", admin_users_list, name="admin-users-list"),
    path("admin/users/create/", admin_create_user, name="admin-create-user"),
    path("admin/users/delete/<int:user_id>/", admin_delete_user, name="admin-delete-user"),
    path("admin/users/bulk-actions/", admin_bulk_actions, name="admin-bulk-actions"),
    path("admin/users/statistics/", admin_user_statistics, name="admin-user-statistics"),
    # API endpoints for React frontend
    path("api/csrf/", get_csrf_token, name="csrf"),
    path("api/register/", api_register_view, name="api_register"),
    path("api/login/", api_login_view, name="api_login"),
    path("api/logout/", api_logout_view, name="api_logout"),
    path("api/user/", user_info, name="user_info"),
    # API endpoints for transactions and categories
    path("api/", include(router.urls)),
]
