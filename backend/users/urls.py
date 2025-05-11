from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    register,
    admin_dashboard,
    admin_users_list,
    admin_create_user,
    admin_delete_user,
    admin_bulk_actions,
    admin_user_statistics,
)

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", auth_views.LoginView.as_view(template_name="login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="/"), name="logout"),
    # Admin URLs
    path("admin-dashboard/", admin_dashboard, name="admin-dashboard"),
    path("admin/users/", admin_users_list, name="admin-users-list"),
    path("admin/users/create/", admin_create_user, name="admin-create-user"),
    path("admin/users/delete/<int:user_id>/", admin_delete_user, name="admin-delete-user"),
    path("admin/users/bulk-actions/", admin_bulk_actions, name="admin-bulk-actions"),
    path("admin/users/statistics/", admin_user_statistics, name="admin-user-statistics"),
]
