"""
Signals for Harvest app.

Handles automatic ledger updates when batch fractions are created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.ledger.models import TankLedger, CompositionKeyType, DerivedSource
from .models import BatchFraction


@receiver(post_save, sender=BatchFraction)
def create_ledger_entry_for_fraction(sender, instance, created, **kwargs):
    """
    When a batch fraction is created, create a ledger entry for the tank.
    
    This tracks the fraction's volume in the tank composition ledger,
    maintaining traceability to the parent batch.
    """
    if created and instance.tank:
        # Create ledger entry for tank receiving the fraction
        TankLedger.objects.create(
            winery=instance.winery,
            batch=instance.batch,
            event_datetime=instance.separation_datetime or timezone.now(),
            tank=instance.tank,
            delta_volume_l=instance.volume_l,
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=instance.batch.id,
            composition_key_label=instance.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT,
        )
        
        # Sync tank volume from ledger
        instance.tank.sync_volume_from_ledger()
