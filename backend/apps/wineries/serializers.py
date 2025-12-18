"""
Serializers for Winery and WineryMembership models.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Winery, WineryMembership

User = get_user_model()


class WinerySerializer(serializers.ModelSerializer):
    """Serializer for Winery model."""
    
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Winery
        fields = [
            'id', 'name', 'code', 'country', 'region', 'address',
            'timezone', 'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'member_count']

    def get_member_count(self, obj):
        return obj.memberships.filter(is_active=True).count()


class WineryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new wineries."""

    class Meta:
        model = Winery
        fields = ['name', 'code', 'country', 'region', 'address', 'timezone']


class WineryMembershipSerializer(serializers.ModelSerializer):
    """Serializer for WineryMembership model."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    winery_name = serializers.CharField(source='winery.name', read_only=True)

    class Meta:
        model = WineryMembership
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'winery', 'winery_name', 'role', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WineryMembershipCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating winery memberships."""
    
    user_email = serializers.EmailField(write_only=True)

    class Meta:
        model = WineryMembership
        fields = ['user_email', 'winery', 'role']

    def validate_user_email(self, value):
        try:
            user = User.objects.get(email=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError('User with this email does not exist.')

    def create(self, validated_data):
        user = validated_data.pop('user_email')
        return WineryMembership.objects.create(user=user, **validated_data)


class UserWineriesSerializer(serializers.ModelSerializer):
    """Serializer for listing user's wineries with their role."""
    
    winery = WinerySerializer(read_only=True)

    class Meta:
        model = WineryMembership
        fields = ['id', 'winery', 'role', 'is_active']





