"""
Serializers for Master Data models.
"""
from rest_framework import serializers
from .models import GrapeVariety, Grower, VineyardBlock, VineyardVariety, TankMaterial, WoodType


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


class VineyardVarietySerializer(serializers.ModelSerializer):
    """Serializer for VineyardVariety through model."""
    variety_name = serializers.CharField(source='variety.name', read_only=True)
    variety_color = serializers.CharField(source='variety.color', read_only=True)
    
    class Meta:
        model = VineyardVariety
        fields = [
            'id', 'variety', 'variety_name', 'variety_color',
            'percentage', 'is_primary', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VineyardBlockSerializer(serializers.ModelSerializer):
    """Serializer for VineyardBlock model."""
    grower_name = serializers.CharField(source='grower.name', read_only=True)
    varieties_data = VineyardVarietySerializer(
        source='variety_plantings',
        many=True,
        read_only=True
    )
    varieties_summary = serializers.SerializerMethodField()
    # For create/update, accept a list of variety objects
    varieties = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = VineyardBlock
        fields = [
            'id', 'grower', 'grower_name', 'name', 'code',
            'region', 'subregion', 'area_acres', 'elevation_m',
            'latitude', 'longitude',
            'varieties', 'varieties_data', 'varieties_summary',
            'soil_type', 'year_planted', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_varieties_summary(self, obj):
        """Return a comma-separated list of variety names."""
        varieties = obj.variety_plantings.select_related('variety').order_by('-is_primary', 'variety__name')
        return ', '.join([vp.variety.name for vp in varieties])
    
    def validate_code(self, value):
        """Convert empty string to None for code field."""
        if value == '':
            return None
        return value
    
    def create(self, validated_data):
        """Create vineyard and its varieties."""
        varieties_data = validated_data.pop('varieties', [])
        vineyard = VineyardBlock.objects.create(**validated_data)
        self._save_varieties(vineyard, varieties_data)
        return vineyard
    
    def update(self, instance, validated_data):
        """Update vineyard and its varieties."""
        varieties_data = validated_data.pop('varieties', None)
        
        # Update vineyard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update varieties if provided
        if varieties_data is not None:
            # Clear existing varieties and recreate
            instance.variety_plantings.all().delete()
            self._save_varieties(instance, varieties_data)
        
        return instance
    
    def _save_varieties(self, vineyard, varieties_data):
        """Helper method to save varieties for a vineyard."""
        for variety_data in varieties_data:
            VineyardVariety.objects.create(
                vineyard=vineyard,
                variety_id=variety_data.get('variety'),
                percentage=variety_data.get('percentage'),
                is_primary=variety_data.get('is_primary', False),
                notes=variety_data.get('notes', '')
            )


class VineyardBlockListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    grower_name = serializers.CharField(source='grower.name', read_only=True)
    display_name = serializers.SerializerMethodField()
    varieties_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = VineyardBlock
        fields = [
            'id', 'name', 'code', 'grower_name', 'display_name', 'region',
            'latitude', 'longitude', 'area_acres', 'varieties_summary'
        ]
    
    def get_display_name(self, obj):
        return f"{obj.grower.name} - {obj.name}"
    
    def get_varieties_summary(self, obj):
        """Return a comma-separated list of variety names."""
        varieties = obj.variety_plantings.select_related('variety').order_by('-is_primary', 'variety__name')
        return ', '.join([vp.variety.name for vp in varieties])


class TankMaterialSerializer(serializers.ModelSerializer):
    """Serializer for TankMaterial model."""
    
    class Meta:
        model = TankMaterial
        fields = [
            'id', 'name', 'code', 'is_active', 'sort_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TankMaterialListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    
    class Meta:
        model = TankMaterial
        fields = ['id', 'name', 'code']


class WoodTypeSerializer(serializers.ModelSerializer):
    """Serializer for WoodType model."""
    
    class Meta:
        model = WoodType
        fields = [
            'id', 'name', 'code', 'origin_country', 'is_active', 'sort_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WoodTypeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown lists."""
    
    class Meta:
        model = WoodType
        fields = ['id', 'name', 'code', 'origin_country']







