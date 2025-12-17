"""
Serializers for Harvest models.
"""
from rest_framework import serializers
from django.db import transaction
from .models import HarvestSeason, Batch, BatchSource


class HarvestSeasonSerializer(serializers.ModelSerializer):
    """Full serializer for HarvestSeason."""
    batch_count = serializers.ReadOnlyField()
    total_grape_weight_kg = serializers.ReadOnlyField()
    
    class Meta:
        model = HarvestSeason
        fields = [
            'id', 'year', 'name', 'start_date', 'end_date',
            'is_active', 'notes', 'batch_count', 'total_grape_weight_kg',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HarvestSeasonListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists."""
    batch_count = serializers.ReadOnlyField()
    
    class Meta:
        model = HarvestSeason
        fields = ['id', 'year', 'name', 'is_active', 'batch_count']


class HarvestSeasonDropdownSerializer(serializers.ModelSerializer):
    """Minimal serializer for dropdowns."""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HarvestSeason
        fields = ['id', 'year', 'name', 'display_name', 'is_active']
    
    def get_display_name(self, obj):
        return str(obj)


class BatchSourceSerializer(serializers.ModelSerializer):
    """Serializer for BatchSource."""
    vineyard_name = serializers.CharField(
        source='vineyard_block.name', 
        read_only=True, 
        allow_null=True
    )
    grower_name = serializers.CharField(
        source='vineyard_block.grower.name', 
        read_only=True, 
        allow_null=True
    )
    variety_name = serializers.CharField(
        source='variety.name', 
        read_only=True, 
        allow_null=True
    )
    variety_color = serializers.CharField(
        source='variety.color', 
        read_only=True, 
        allow_null=True
    )
    
    class Meta:
        model = BatchSource
        fields = [
            'id', 'vineyard_block', 'vineyard_name', 'grower_name',
            'variety', 'variety_name', 'variety_color',
            'weight_kg', 'is_estimated', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BatchSourceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating batch sources."""
    
    class Meta:
        model = BatchSource
        fields = ['vineyard_block', 'variety', 'weight_kg', 'is_estimated', 'notes']


class BatchSerializer(serializers.ModelSerializer):
    """Full serializer for Batch."""
    sources = BatchSourceSerializer(many=True, read_only=True)
    season_name = serializers.CharField(source='harvest_season.name', read_only=True)
    season_year = serializers.IntegerField(source='harvest_season.year', read_only=True)
    tank_code = serializers.CharField(source='initial_tank.code', read_only=True, allow_null=True)
    tank_name = serializers.CharField(source='initial_tank.name', read_only=True, allow_null=True)
    source_count = serializers.ReadOnlyField()
    primary_variety_name = serializers.SerializerMethodField()
    variety_breakdown = serializers.ReadOnlyField()
    
    class Meta:
        model = Batch
        fields = [
            'id', 'batch_code', 'harvest_season', 'season_name', 'season_year',
            'intake_date', 'source_type', 'initial_tank', 'tank_code', 'tank_name',
            'grape_weight_kg', 'must_volume_l', 'stage', 'notes',
            'source_count', 'primary_variety_name', 'variety_breakdown',
            'sources', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'batch_code', 'grape_weight_kg', 'created_at', 'updated_at']
    
    def get_primary_variety_name(self, obj):
        variety = obj.primary_variety
        return variety.name if variety else None


class BatchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for batch lists."""
    season_year = serializers.IntegerField(source='harvest_season.year', read_only=True)
    tank_code = serializers.CharField(source='initial_tank.code', read_only=True, allow_null=True)
    source_count = serializers.ReadOnlyField()
    primary_variety_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id', 'batch_code', 'season_year', 'intake_date',
            'source_type', 'tank_code', 'grape_weight_kg', 'must_volume_l',
            'stage', 'source_count', 'primary_variety_name'
        ]
    
    def get_primary_variety_name(self, obj):
        variety = obj.primary_variety
        return variety.name if variety else None


class BatchCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating batches with sources."""
    sources = BatchSourceCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Batch
        fields = [
            'harvest_season', 'intake_date', 'source_type',
            'initial_tank', 'must_volume_l', 'notes', 'sources'
        ]
    
    @transaction.atomic
    def create(self, validated_data):
        sources_data = validated_data.pop('sources', [])
        winery = self.context['request'].winery
        
        batch = Batch.objects.create(winery=winery, **validated_data)
        
        total_weight = 0
        for source_data in sources_data:
            source = BatchSource.objects.create(
                winery=winery,
                batch=batch,
                **source_data
            )
            total_weight += source.weight_kg
        
        batch.grape_weight_kg = total_weight
        batch.save(update_fields=['grape_weight_kg'])
        
        return batch


class BatchUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating batches."""
    
    class Meta:
        model = Batch
        fields = [
            'harvest_season', 'intake_date', 'source_type',
            'initial_tank', 'must_volume_l', 'stage', 'notes'
        ]



