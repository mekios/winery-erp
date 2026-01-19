"""
Signals for Harvest app.

Handles automatic transfer creation when batch fractions are created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import BatchFraction


@receiver(post_save, sender=BatchFraction)
def create_transfer_for_fraction(sender, instance, created, **kwargs):
    """
    When a batch fraction is created, create a Transfer record.
    
    This creates a proper transfer from the batch (external source) to the tank,
    which automatically creates the appropriate ledger entries through the 
    transfer signal system.
    
    The transfer will:
    - Have no source_tank (external/batch intake)
    - Have destination_tank set to the fraction's tank
    - Have batch attribution for proper composition tracking
    - Use FILL action type (initial fill from harvest)
    """
    if created and instance.tank:
        from apps.production.models import Transfer, TransferActionType
        
        # Create a transfer record representing the fraction going into the tank
        Transfer.objects.create(
            winery=instance.winery,
            action_type=TransferActionType.FILL,
            transfer_date=instance.separation_datetime or timezone.now(),
            source_tank=None,  # External source (from batch)
            source_barrel=None,
            destination_tank=instance.tank,
            destination_barrel=None,
            volume_l=instance.volume_l,
            batch=instance.batch,  # Explicit batch attribution
            notes=f"Batch fraction: {instance.get_fraction_type_display()} - {instance.fraction_code or ''}"
        )
