from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .forms import RegisterForm


# Traditional Django views (for browser-based usage)
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


def is_admin(user):
    return user.is_authenticated and user.is_admin()


@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    return render(request, "users/admin_dashboard.html")


# API views for React frontend
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    View to get a CSRF token for API requests
    """
    return JsonResponse({"detail": "CSRF cookie set"})


@csrf_exempt  # Temporarily disable CSRF for development
@api_view(["POST"])
@permission_classes([AllowAny])
def api_register_view(request):
    """API endpoint for user registration"""
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
    else:
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt  # Temporarily disable CSRF for development
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login_view(request):
    """API endpoint for user login"""
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
                "token": "session-auth",  # We're using session auth, but returning a placeholder for the frontend
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_logout_view(request):
    """API endpoint for user logout"""
    logout(request)
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    """API endpoint to get current user info"""
    user = request.user
    return Response(
        {
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin(),
        }
    )
