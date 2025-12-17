"""
Serializers for Master Data models.
"""
from rest_framework import serializers
from .models import GrapeVariety, Grower, VineyardBlock


class GrapeVarietySerializer(serializers.ModelSerializer):
    """Serializer for GrapeVariety model."""
    
    class Meta:
        model = GrapeVariety
        fields = [
            'id', 'name', 'code', 'color', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GrapeVarietyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    
    class Meta:
        model = GrapeVariety
        fields = ['id', 'name', 'code', 'color']


class GrowerSerializer(serializers.ModelSerializer):
    """Serializer for Grower model."""
    vineyard_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Grower
        fields = [
            'id', 'name', 'contact_name', 'phone', 'email', 'address',
            'is_active', 'notes', 'vineyard_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GrowerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    
    class Meta:
        model = Grower
        fields = ['id', 'name']


class VineyardBlockSerializer(serializers.ModelSerializer):
    """Serializer for VineyardBlock model."""
    grower_name = serializers.CharField(source='grower.name', read_only=True)
    primary_variety_name = serializers.CharField(
        source='primary_variety.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = VineyardBlock
        fields = [
            'id', 'grower', 'grower_name', 'name', 'code',
            'region', 'subregion', 'area_ha', 'elevation_m',
            'primary_variety', 'primary_variety_name',
            'soil_type', 'year_planted', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VineyardBlockListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    grower_name = serializers.CharField(source='grower.name', read_only=True)
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = VineyardBlock
        fields = ['id', 'name', 'code', 'grower_name', 'display_name', 'region']
    
    def get_display_name(self, obj):
        return f"{obj.grower.name} - {obj.name}"




