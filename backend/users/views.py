from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Count
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .forms import RegisterForm, AdminUserCreationForm, UserBulkActionForm
from .models import CustomUser
from django.contrib.auth.forms import AuthenticationForm
from django.db.models.functions import TruncMonth


# ------------------------------
# Traditional Django Views (HTML)
# ------------------------------


def register(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful!")
            return redirect("home")
    else:
        form = RegisterForm()
    return render(request, "users/register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect("home")
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, "users/login.html", {"form": form})


# ------------------------------
# Admin Views (JSON API for Admin Dashboard)
# ------------------------------


def is_admin(user):
    return user.is_authenticated and user.is_admin()


@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    users_count = CustomUser.objects.count()
    active_users = CustomUser.objects.filter(is_active=True).count()
    admin_users = CustomUser.objects.filter(role="admin").count()
    regular_users = CustomUser.objects.filter(role="user").count()

    response_data = {
        "users_count": users_count,
        "active_users": active_users,
        "admin_users": admin_users,
        "regular_users": regular_users,
    }

    return JsonResponse(response_data)


@login_required
@user_passes_test(is_admin)
def admin_users_list(request):
    users = CustomUser.objects.all().order_by("username")
    bulk_form = UserBulkActionForm()
    bulk_form.fields["users"].queryset = users

    return JsonResponse(
        {"users": list(users.values("id", "username", "email", "role", "is_active", "date_joined"))}
    )


@login_required
@user_passes_test(is_admin)
def admin_create_user(request):
    if request.method == "POST":
        form = AdminUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            return JsonResponse(
                {
                    "success": True,
                    "message": f"User {user.username} created successfully!",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "is_active": user.is_active,
                    },
                },
                status=200,
            )
        else:
            return JsonResponse({"success": False, "errors": form.errors}, status=400)
    else:
        return JsonResponse(
            {"success": True, "message": "GET request for create user form"}, status=200
        )


@login_required
@user_passes_test(is_admin)
def admin_delete_user(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)

    if user.id == request.user.id:
        return JsonResponse(
            {"success": False, "error": "You cannot delete your own account"}, status=400
        )

    user_name = user.username
    user.delete()

    return JsonResponse({"success": True, "message": f"User {user_name} deleted successfully!"})


@login_required
@user_passes_test(is_admin)
@require_POST
def admin_bulk_actions(request):
    form = UserBulkActionForm(request.POST)

    if form.is_valid():
        users = form.cleaned_data["users"]
        action = form.cleaned_data["action"]
        current_user = request.user

        users = users.exclude(id=current_user.id)

        if action == "delete":
            deleted_count = users.count()
            users.delete()
            message = f"{deleted_count} user(s) deleted successfully!"
        elif action == "activate":
            users.update(is_active=True)
            message = f"{users.count()} user(s) activated successfully!"
        elif action == "deactivate":
            users.update(is_active=False)
            message = f"{users.count()} user(s) deactivated successfully!"

        return JsonResponse({"success": True, "message": message})
    else:
        return JsonResponse(
            {"success": False, "errors": form.errors, "message": "Invalid form submission."},
            status=400,
        )


@login_required
@user_passes_test(is_admin)
def admin_user_statistics(request):
    total_users = CustomUser.objects.count()
    active_users = CustomUser.objects.filter(is_active=True).count()
    inactive_users = total_users - active_users
    admin_users = CustomUser.objects.filter(role="admin").count()
    regular_users = CustomUser.objects.filter(role="user").count()

    users_by_month = (
        CustomUser.objects.annotate(month=TruncMonth("date_joined"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )

    users_by_month_data = [
        {"month": entry["month"].strftime("%Y-%m"), "count": entry["count"]}
        for entry in users_by_month
    ]

    return JsonResponse(
        {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "admin_users": admin_users,
            "regular_users": regular_users,
            "users_by_month": users_by_month_data,
        }
    )


# ------------------------------
# API Views (for React Frontend)
# ------------------------------


@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_register_view(request):
    form = RegisterForm(request.data)
    if form.is_valid():
        user = form.save()
        login(request, user)
        return Response(
            {
                "user": user.username,
                "email": user.email,
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login_view(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        return Response(
            {
                "user": user.username,
                "email": user.email,
                "message": "Login successful",
                "token": "session-auth",  # Placeholder for frontend
            },
            status=status.HTTP_200_OK,
        )
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_logout_view(request):
    logout(request)
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    return Response(
        {
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin(),
        }
    )
