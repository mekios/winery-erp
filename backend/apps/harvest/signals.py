"""
Signal handlers for harvest app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Batch


@receiver(post_save, sender=Batch)
def update_tank_status_on_batch_create(sender, instance, created, **kwargs):
    """
    When a batch is created with an initial_tank, set the tank status to IN_USE.
    """
    if created and instance.initial_tank:
        tank = instance.initial_tank
        if tank.status == 'EMPTY':
            tank.status = 'IN_USE'
            tank.save(update_fields=['status'])


@receiver(post_save, sender=Batch)
def create_ledger_entry_on_batch_create(sender, instance, created, **kwargs):
    """
    When a batch is created with an initial_tank and must_volume,
    create a ledger entry and update the tank's current volume.
    """
    # Only process on creation
    if not created:
        return
    
    # Only create ledger if there's a tank and volume
    if not instance.initial_tank or not instance.must_volume_l or instance.must_volume_l <= 0:
        return
    
    # Import here to avoid circular imports
    from apps.ledger.models import TankLedger, CompositionKeyType, DerivedSource
    
    # Create a ledger entry for the must going into the tank
    TankLedger.objects.create(
        winery=instance.winery,
        batch=instance,  # Link to batch
        event_datetime=instance.intake_date,
        tank=instance.initial_tank,
        delta_volume_l=instance.must_volume_l,
        composition_key_type=CompositionKeyType.BATCH,
        composition_key_id=instance.id,
        composition_key_label=instance.batch_code,
        derived_source=DerivedSource.EXPLICIT,
    )
    
    # Update the tank's current volume
    tank = instance.initial_tank
    tank.current_volume_l += instance.must_volume_l
    tank.save(update_fields=['current_volume_l'])


