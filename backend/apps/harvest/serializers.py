"""
Serializers for Harvest models.
"""
from rest_framework import serializers
from django.db import transaction
from .models import HarvestSeason, Batch, BatchSource, BatchFraction


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
    total_grape_weight_kg = serializers.ReadOnlyField()
    
    class Meta:
        model = HarvestSeason
        fields = ['id', 'year', 'name', 'is_active', 'batch_count', 'total_grape_weight_kg']


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


class BatchFractionCreateInlineSerializer(serializers.Serializer):
    """Simplified serializer for creating fractions inline with batch."""
    fraction_type = serializers.ChoiceField(choices=BatchFraction.FRACTION_TYPE_CHOICES)
    tank = serializers.UUIDField(required=False, allow_null=True)
    volume_l = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    separation_datetime = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class BatchFractionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for fraction lists."""
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)
    tank_code = serializers.CharField(source='tank.code', read_only=True, allow_null=True)
    tank_id = serializers.UUIDField(source='tank.id', read_only=True, allow_null=True)
    fraction_type_display = serializers.CharField(source='get_fraction_type_display', read_only=True)
    
    class Meta:
        model = BatchFraction
        fields = [
            'id', 'batch_code', 'fraction_code', 'fraction_type', 
            'fraction_type_display', 'tank_code', 'tank_id', 'volume_l', 'separation_datetime'
        ]


class BatchSerializer(serializers.ModelSerializer):
    """Full serializer for Batch."""
    sources = BatchSourceSerializer(many=True, read_only=True)
    fractions = BatchFractionListSerializer(many=True, read_only=True)
    season_name = serializers.CharField(source='harvest_season.name', read_only=True)
    season_year = serializers.IntegerField(source='harvest_season.year', read_only=True)
    source_count = serializers.ReadOnlyField()
    primary_variety_name = serializers.SerializerMethodField()
    variety_breakdown = serializers.ReadOnlyField()
    total_fraction_volume = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id', 'batch_code', 'harvest_season', 'season_name', 'season_year',
            'intake_date', 'source_type',
            'grape_weight_kg', 'must_volume_l', 'stage', 'notes',
            'source_count', 'primary_variety_name', 'variety_breakdown',
            'sources', 'fractions', 'total_fraction_volume',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'batch_code', 'grape_weight_kg', 'created_at', 'updated_at']
    
    def get_primary_variety_name(self, obj):
        variety = obj.primary_variety
        return variety.name if variety else None
    
    def get_total_fraction_volume(self, obj):
        """Calculate total volume across all fractions."""
        total = obj.fractions.aggregate(
            total=serializers.models.Sum('volume_l')
        )['total']
        return float(total) if total else 0


class BatchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for batch lists."""
    season_year = serializers.IntegerField(source='harvest_season.year', read_only=True)
    source_count = serializers.ReadOnlyField()
    primary_variety_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id', 'batch_code', 'season_year', 'intake_date',
            'source_type', 'grape_weight_kg', 'must_volume_l',
            'stage', 'source_count', 'primary_variety_name'
        ]
    
    def get_primary_variety_name(self, obj):
        variety = obj.primary_variety
        return variety.name if variety else None


class BatchCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating batches with sources and fractions."""
    sources = BatchSourceCreateSerializer(many=True, required=False)
    fractions = BatchFractionCreateInlineSerializer(many=True, required=False)
    
    class Meta:
        model = Batch
        fields = [
            'harvest_season', 'intake_date', 'source_type',
            'must_volume_l', 'notes', 'sources', 'fractions'
        ]
    
    def validate(self, data):
        """Validate that total fraction volumes don't exceed batch volume and tank capacities."""
        from apps.equipment.models import Tank
        
        fractions = data.get('fractions', [])
        must_volume = data.get('must_volume_l', 0)
        winery = self.context['request'].winery
        
        if fractions and must_volume:
            total_fraction_volume = sum(f['volume_l'] for f in fractions)
            if total_fraction_volume > must_volume:
                raise serializers.ValidationError({
                    'fractions': f'Total fraction volumes ({total_fraction_volume}L) exceed batch volume ({must_volume}L)'
                })
        
        # Validate each fraction's tank capacity
        for i, fraction in enumerate(fractions):
            tank_id = fraction.get('tank')
            volume_l = fraction.get('volume_l', 0)
            
            if tank_id and volume_l:
                try:
                    tank = Tank.objects.get(id=tank_id, winery=winery)
                    can_accept, error_msg = tank.can_accept_volume(volume_l)
                    if not can_accept:
                        raise serializers.ValidationError({
                            f'fractions[{i}].volume_l': error_msg
                        })
                except Tank.DoesNotExist:
                    raise serializers.ValidationError({
                        f'fractions[{i}].tank': 'Tank not found'
                    })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        from apps.equipment.models import Tank
        
        sources_data = validated_data.pop('sources', [])
        fractions_data = validated_data.pop('fractions', [])
        winery = self.context['request'].winery
        
        # Create batch (timestamp-based code ensures uniqueness)
        batch = Batch.objects.create(winery=winery, **validated_data)
        
        # Create sources
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
        
        # Create fractions
        for fraction_data in fractions_data:
            tank_id = fraction_data.pop('tank', None)
            tank = None
            
            # Fetch tank instance if tank_id is provided
            if tank_id:
                try:
                    tank = Tank.objects.get(id=tank_id, winery=winery)
                except Tank.DoesNotExist:
                    pass
            
            BatchFraction.objects.create(
                winery=winery,
                batch=batch,
                tank=tank,
                **fraction_data
            )
        
        return batch


class BatchUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating batches."""
    
    class Meta:
        model = Batch
        fields = [
            'harvest_season', 'intake_date', 'source_type',
            'must_volume_l', 'stage', 'notes'
        ]


class BatchFractionSerializer(serializers.ModelSerializer):
    """Full serializer for BatchFraction."""
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)
    tank_code = serializers.CharField(source='tank.code', read_only=True, allow_null=True)
    tank_name = serializers.CharField(source='tank.name', read_only=True, allow_null=True)
    fraction_type_display = serializers.CharField(source='get_fraction_type_display', read_only=True)
    
    class Meta:
        model = BatchFraction
        fields = [
            'id', 'batch', 'batch_code', 'fraction_type', 'fraction_type_display',
            'fraction_code', 'tank', 'tank_code', 'tank_name', 'volume_l',
            'separation_datetime', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fraction_code', 'created_at', 'updated_at']


class BatchFractionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating batch fractions."""
    
    class Meta:
        model = BatchFraction
        fields = ['batch', 'fraction_type', 'tank', 'volume_l', 'separation_datetime', 'notes']
    
    def validate(self, data):
        """Validate that total fractions don't exceed batch volume."""
        batch = data.get('batch')
        new_volume = data.get('volume_l', 0)
        
        if batch:
            # Calculate total existing fraction volumes
            existing_total = BatchFraction.objects.filter(
                batch=batch
            ).aggregate(
                total=serializers.models.Sum('volume_l')
            )['total'] or 0
            
            # Add new volume
            total_volume = existing_total + new_volume
            
            # Check against batch must volume
            if total_volume > batch.must_volume_l:
                raise serializers.ValidationError({
                    'volume_l': f'Total fraction volumes ({total_volume}L) would exceed batch volume ({batch.must_volume_l}L)'
                })
        
        return data
    
    def create(self, validated_data):
        winery = self.context['request'].winery
        return BatchFraction.objects.create(winery=winery, **validated_data)












