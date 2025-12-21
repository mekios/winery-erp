"""
Serializers for Equipment models.
"""
from rest_framework import serializers
from .models import Tank, Barrel, Equipment


class TankSerializer(serializers.ModelSerializer):
    """Full serializer for Tank model."""
    fill_percentage = serializers.ReadOnlyField()
    available_capacity_l = serializers.ReadOnlyField()
    
    class Meta:
        model = Tank
        fields = [
            'id', 'code', 'name', 'tank_type', 'material',
            'capacity_l', 'current_volume_l', 'fill_percentage', 'available_capacity_l',
            'location', 'status', 'has_cooling', 'has_heating',
            'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TankListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tank lists and dropdowns."""
    fill_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Tank
        fields = [
            'id', 'code', 'name', 'tank_type', 'material',
            'capacity_l', 'current_volume_l', 'fill_percentage',
            'status', 'is_active'
        ]


class TankDropdownSerializer(serializers.ModelSerializer):
    """Minimal serializer for dropdowns."""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Tank
        fields = ['id', 'code', 'name', 'display_name', 'capacity_l', 'current_volume_l', 'status']
    
    def get_display_name(self, obj):
        return f"{obj.code} - {obj.name}" if obj.name else obj.code


class BarrelSerializer(serializers.ModelSerializer):
    """Full serializer for Barrel model."""
    age_years = serializers.ReadOnlyField()
    
    class Meta:
        model = Barrel
        fields = [
            'id', 'code', 'volume_l', 'current_volume_l',
            'wood_type', 'toast_level', 'cooper',
            'vintage_year', 'first_use_year', 'age_years', 'use_count',
            'location', 'status', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BarrelListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for barrel lists."""
    age_years = serializers.ReadOnlyField()
    
    class Meta:
        model = Barrel
        fields = [
            'id', 'code', 'volume_l', 'wood_type', 'toast_level',
            'vintage_year', 'age_years', 'use_count', 'status', 'is_active'
        ]


class BarrelDropdownSerializer(serializers.ModelSerializer):
    """Minimal serializer for dropdowns."""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Barrel
        fields = ['id', 'code', 'display_name', 'volume_l', 'wood_type', 'status']
    
    def get_display_name(self, obj):
        return f"{obj.code} ({obj.wood_type})"


class EquipmentSerializer(serializers.ModelSerializer):
    """Full serializer for Equipment model."""
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'code', 'equipment_type',
            'manufacturer', 'model', 'serial_number',
            'purchase_date', 'capacity', 'location', 'status',
            'last_maintenance', 'next_maintenance',
            'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EquipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for equipment lists."""
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'code', 'equipment_type',
            'manufacturer', 'model', 'status', 'is_active'
        ]






