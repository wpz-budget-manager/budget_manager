from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.db.models.functions import TruncMonth
from .models import CustomUser
from .serializers import CustomUserSerializer


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management.
    """

    queryset = CustomUser.objects.all().order_by("username")
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def perform_create(self, serializer):
        # Handle password separately
        password = self.request.data.get("password")
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
        return user

    def perform_update(self, serializer):
        # Handle password separately if provided
        password = self.request.data.get("password")
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
        return user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def bulk_actions(request):
    """
    Perform bulk actions on selected users.
    """
    user_ids = request.data.get("user_ids", [])
    action = request.data.get("action")
    current_user_id = request.user.id

    if not user_ids or not action:
        return Response({"error": "Missing user_ids or action"}, status=status.HTTP_400_BAD_REQUEST)

    # Remove current user from the list to prevent self-changes
    if current_user_id in user_ids:
        user_ids.remove(current_user_id)

    users = CustomUser.objects.filter(id__in=user_ids)

    if action == "delete":
        deleted_count = users.count()
        users.delete()
        return Response({"message": f"{deleted_count} user(s) deleted successfully"})
    elif action == "activate":
        users.update(is_active=True)
        return Response({"message": f"{users.count()} user(s) activated successfully"})
    elif action == "deactivate":
        users.update(is_active=False)
        return Response({"message": f"{users.count()} user(s) deactivated successfully"})
    else:
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def user_statistics(request):
    """
    Get user statistics.
    """
    # Basic user statistics
    total_users = CustomUser.objects.count()
    active_users = CustomUser.objects.filter(is_active=True).count()
    inactive_users = total_users - active_users
    admin_users = CustomUser.objects.filter(role="admin").count()
    regular_users = CustomUser.objects.filter(role="user").count()

    # Users created by month
    users_by_month = (
        CustomUser.objects.annotate(month=TruncMonth("date_joined"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )

    # Convert to list for serialization
    users_by_month_data = [
        {"month": entry["month"].strftime("%Y-%m"), "count": entry["count"]}
        for entry in users_by_month
    ]

    return Response(
        {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "admin_users": admin_users,
            "regular_users": regular_users,
            "users_by_month": users_by_month_data,
        }
    )
