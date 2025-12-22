from rest_framework import serializers
from decimal import Decimal
from .models import TankLedger


class TankLedgerEntrySerializer(serializers.ModelSerializer):
    """Serializer for individual ledger entries."""
    tank_code = serializers.CharField(source='tank.code', read_only=True)
    
    class Meta:
        model = TankLedger
        fields = [
            'id', 'event_datetime', 'tank', 'tank_code',
            'delta_volume_l', 'composition_key_type',
            'composition_key_id', 'composition_key_label',
            'derived_source', 'created_at'
        ]


class CompositionBatchSerializer(serializers.Serializer):
    """Serializer for batch composition breakdown."""
    batch_id = serializers.UUIDField()
    label = serializers.CharField()
    volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class CompositionVarietySerializer(serializers.Serializer):
    """Serializer for variety composition breakdown."""
    variety = serializers.CharField()
    volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class CompositionVineyardSerializer(serializers.Serializer):
    """Serializer for vineyard/grower composition breakdown."""
    vineyard = serializers.CharField()
    grower = serializers.CharField()
    volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class TankCompositionSerializer(serializers.Serializer):
    """Serializer for complete tank composition."""
    tank_id = serializers.UUIDField()
    tank_code = serializers.CharField()
    tank_name = serializers.CharField(allow_blank=True)
    total_volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    by_batch = CompositionBatchSerializer(many=True)
    by_variety = CompositionVarietySerializer(many=True)
    by_vineyard = CompositionVineyardSerializer(many=True)
    unknown_volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    unknown_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    has_integrity_issues = serializers.BooleanField()


class TankIntegritySerializer(serializers.Serializer):
    """Serializer for tank integrity check results."""
    tank_id = serializers.UUIDField()
    tank_code = serializers.CharField()
    has_unknown_volume = serializers.BooleanField()
    unknown_volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    unknown_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    has_negative_composition = serializers.BooleanField()
    ledger_volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    tank_current_volume_l = serializers.DecimalField(max_digits=10, decimal_places=2)
    volume_mismatch_l = serializers.DecimalField(max_digits=10, decimal_places=2)

