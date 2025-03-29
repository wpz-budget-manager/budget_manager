from django.urls import path
from django.contrib.auth import views as auth_views
from .views import register, admin_dashboard

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", auth_views.LoginView.as_view(template_name="login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="/"), name="logout"),
    path("admin-dashboard/", admin_dashboard, name="admin-dashboard"),
]
