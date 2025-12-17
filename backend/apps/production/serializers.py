from rest_framework import serializers
from .models import Transfer, TransferActionType, WineLot, WineLotStatus, LotBatchLink


class TransferSerializer(serializers.ModelSerializer):
    """Serializer for Transfer model."""
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    source_tank_name = serializers.CharField(source='source_tank.name', read_only=True, allow_null=True)
    source_tank_code = serializers.CharField(source='source_tank.code', read_only=True, allow_null=True)
    destination_tank_name = serializers.CharField(source='destination_tank.name', read_only=True, allow_null=True)
    destination_tank_code = serializers.CharField(source='destination_tank.code', read_only=True, allow_null=True)
    source_barrel_code = serializers.CharField(source='source_barrel.code', read_only=True, allow_null=True)
    destination_barrel_code = serializers.CharField(source='destination_barrel.code', read_only=True, allow_null=True)
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True, allow_null=True)
    wine_lot_code = serializers.CharField(source='wine_lot.lot_code', read_only=True, allow_null=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Transfer
        fields = [
            'id', 'winery',
            'action_type', 'action_type_display',
            'transfer_date',
            'source_tank', 'source_tank_name', 'source_tank_code',
            'source_barrel', 'source_barrel_code',
            'destination_tank', 'destination_tank_name', 'destination_tank_code',
            'destination_barrel', 'destination_barrel_code',
            'volume_l', 'temperature_c',
            'batch', 'batch_code',
            'wine_lot', 'wine_lot_code',
            'notes',
            'performed_by', 'performed_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'winery', 'created_at', 'updated_at']


class TransferCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transfers with validation."""
    
    class Meta:
        model = Transfer
        fields = [
            'action_type', 'transfer_date',
            'source_tank', 'source_barrel',
            'destination_tank', 'destination_barrel',
            'volume_l', 'temperature_c',
            'batch', 'wine_lot',
            'notes',
        ]
    
    def validate(self, attrs):
        action_type = attrs.get('action_type')
        source_tank = attrs.get('source_tank')
        source_barrel = attrs.get('source_barrel')
        destination_tank = attrs.get('destination_tank')
        destination_barrel = attrs.get('destination_barrel')
        volume_l = attrs.get('volume_l')
        
        # Validate source exists for most action types
        if action_type not in [TransferActionType.FILL]:
            if not source_tank and not source_barrel:
                raise serializers.ValidationError({
                    'source_tank': 'Source tank or barrel is required for this action type.'
                })
        
        # Validate destination exists for most action types
        if action_type not in [TransferActionType.DRAIN, TransferActionType.BOTTLE]:
            if not destination_tank and not destination_barrel:
                raise serializers.ValidationError({
                    'destination_tank': 'Destination tank or barrel is required for this action type.'
                })
        
        # Validate volume doesn't exceed source
        if source_tank and source_tank.current_volume_l < volume_l:
            raise serializers.ValidationError({
                'volume_l': f'Volume exceeds source tank current volume ({source_tank.current_volume_l}L available).'
            })
        
        if source_barrel and source_barrel.current_volume_l < volume_l:
            raise serializers.ValidationError({
                'volume_l': f'Volume exceeds source barrel current volume ({source_barrel.current_volume_l}L available).'
            })
        
        # Validate destination has capacity
        if destination_tank:
            available = destination_tank.capacity_l - destination_tank.current_volume_l
            if volume_l > available:
                raise serializers.ValidationError({
                    'volume_l': f'Volume exceeds destination tank available capacity ({available}L available).'
                })
        
        if destination_barrel:
            available = destination_barrel.capacity_l - destination_barrel.current_volume_l
            if volume_l > available:
                raise serializers.ValidationError({
                    'volume_l': f'Volume exceeds destination barrel available capacity ({available}L available).'
                })
        
        return attrs
    
    def create(self, validated_data):
        # Set winery from request context
        validated_data['winery'] = self.context['request'].winery
        validated_data['performed_by'] = self.context['request'].user
        
        transfer = super().create(validated_data)
        
        # Update tank/barrel volumes
        self._update_volumes(transfer)
        
        return transfer
    
    def _update_volumes(self, transfer):
        """Update source and destination volumes after transfer."""
        volume = transfer.volume_l
        
        # Decrease source volume
        if transfer.source_tank:
            transfer.source_tank.current_volume_l -= volume
            transfer.source_tank.save(update_fields=['current_volume_l'])
        elif transfer.source_barrel:
            transfer.source_barrel.current_volume_l -= volume
            transfer.source_barrel.save(update_fields=['current_volume_l'])
        
        # Increase destination volume
        if transfer.destination_tank:
            transfer.destination_tank.current_volume_l += volume
            transfer.destination_tank.save(update_fields=['current_volume_l'])
        elif transfer.destination_barrel:
            transfer.destination_barrel.current_volume_l += volume
            transfer.destination_barrel.save(update_fields=['current_volume_l'])


class LotBatchLinkSerializer(serializers.ModelSerializer):
    """Serializer for batch links within a wine lot."""
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)
    batch_date = serializers.DateField(source='batch.harvest_date', read_only=True)
    
    class Meta:
        model = LotBatchLink
        fields = [
            'id', 'batch', 'batch_code', 'batch_date',
            'volume_l', 'percentage', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WineLotSerializer(serializers.ModelSerializer):
    """Serializer for WineLot model."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_tank_code = serializers.CharField(source='current_tank.code', read_only=True, allow_null=True)
    current_barrel_code = serializers.CharField(source='current_barrel.code', read_only=True, allow_null=True)
    batch_links = LotBatchLinkSerializer(many=True, read_only=True)
    batch_varieties = serializers.SerializerMethodField()
    
    class Meta:
        model = WineLot
        fields = [
            'id', 'winery',
            'lot_code', 'name', 'vintage', 'wine_type',
            'status', 'status_display',
            'initial_volume_l', 'current_volume_l',
            'current_tank', 'current_tank_code',
            'current_barrel', 'current_barrel_code',
            'batch_links', 'batch_varieties',
            'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'winery', 'created_at', 'updated_at']
    
    def get_batch_varieties(self, obj):
        return obj.batch_varieties


class WineLotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating wine lots."""
    batch_links = LotBatchLinkSerializer(many=True, required=False)
    
    class Meta:
        model = WineLot
        fields = [
            'lot_code', 'name', 'vintage', 'wine_type',
            'status', 'initial_volume_l', 'current_volume_l',
            'current_tank', 'current_barrel',
            'batch_links', 'notes',
        ]
    
    def validate_lot_code(self, value):
        winery = self.context['request'].winery
        if WineLot.objects.filter(winery=winery, lot_code=value).exists():
            if not self.instance or self.instance.lot_code != value:
                raise serializers.ValidationError('A lot with this code already exists.')
        return value
    
    def create(self, validated_data):
        batch_links_data = validated_data.pop('batch_links', [])
        validated_data['winery'] = self.context['request'].winery
        
        wine_lot = WineLot.objects.create(**validated_data)
        
        # Create batch links
        for link_data in batch_links_data:
            LotBatchLink.objects.create(wine_lot=wine_lot, **link_data)
        
        return wine_lot
    
    def update(self, instance, validated_data):
        batch_links_data = validated_data.pop('batch_links', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update batch links if provided
        if batch_links_data is not None:
            instance.batch_links.all().delete()
            for link_data in batch_links_data:
                LotBatchLink.objects.create(wine_lot=instance, **link_data)
        
        return instance


# Choices for frontend
TRANSFER_ACTION_CHOICES = [
    {'value': choice[0], 'label': choice[1]}
    for choice in TransferActionType.choices
]

WINE_LOT_STATUS_CHOICES = [
    {'value': choice[0], 'label': choice[1]}
    for choice in WineLotStatus.choices
]


