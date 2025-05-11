from rest_framework import serializers
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["date_joined"]

    def create(self, validated_data):
        # Remove password to handle it separately in the viewset
        password = validated_data.pop("password", None)
        user = CustomUser.objects.create(**validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user

    def update(self, instance, validated_data):
        # Remove password to handle it separately in the viewset
        password = validated_data.pop("password", None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Handle password separately if provided
        if password:
            instance.set_password(password)
            instance.save()

        return instance
