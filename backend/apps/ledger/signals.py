"""
Django signals for automatically creating ledger entries on transfer events.

The ledger engine handles:
1. Explicit attribution - when transfer has batch_id
2. Proportional inheritance - when transfer has no batch_id but source tank has composition
3. Unknown attribution - when source tank has no known composition
"""
from decimal import Decimal
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.production.models import Transfer
from .models import TankLedger, CompositionKeyType, DerivedSource


@receiver(post_save, sender=Transfer)
def create_ledger_entries(sender, instance, created, **kwargs):
    """
    Create ledger entries when a transfer is saved.
    
    Logic:
    1. If source_tank exists: create negative (outflow) entries
    2. If destination_tank exists: create positive (inflow) entries
    
    Attribution:
    - If transfer.batch is set: use explicit batch attribution
    - If transfer.batch is None: inherit source tank composition proportionally
    - If source has no composition: attribute to UNKNOWN
    """
    if not created:
        # Only process on creation (transfers are immutable)
        # For updates, we'd need to delete old entries and recreate
        return
    
    transfer = instance
    
    # Handle outflow from source tank
    if transfer.source_tank:
        _create_outflow_entries(transfer)
    
    # Handle inflow to destination tank
    if transfer.destination_tank:
        _create_inflow_entries(transfer)


def _create_outflow_entries(transfer):
    """Create negative ledger entries for volume leaving a tank."""
    volume_out = -abs(transfer.volume_l)  # Ensure negative
    
    if transfer.batch:
        # Explicit attribution - single entry
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=transfer.source_tank,
            delta_volume_l=volume_out,
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=transfer.batch.id,
            composition_key_label=transfer.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT,
        )
    else:
        # Inherit from source tank composition
        _create_inherited_entries(
            transfer=transfer,
            tank=transfer.source_tank,
            volume=volume_out,
            is_outflow=True,
        )


def _create_inflow_entries(transfer):
    """Create positive ledger entries for volume entering a tank."""
    volume_in = abs(transfer.volume_l)  # Ensure positive
    
    if transfer.batch:
        # Explicit attribution - single entry
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=transfer.destination_tank,
            delta_volume_l=volume_in,
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=transfer.batch.id,
            composition_key_label=transfer.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT,
        )
    elif transfer.source_tank:
        # Inherit from source tank composition
        _create_inherited_entries(
            transfer=transfer,
            tank=transfer.destination_tank,
            volume=volume_in,
            is_outflow=False,
            source_tank=transfer.source_tank,
        )
    else:
        # No source tank and no batch - this is external input, mark as unknown
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=transfer.destination_tank,
            delta_volume_l=volume_in,
            composition_key_type=CompositionKeyType.UNKNOWN,
            composition_key_id=None,
            composition_key_label='Unknown (External)',
            derived_source=DerivedSource.UNKNOWN,
        )


def _create_inherited_entries(transfer, tank, volume, is_outflow, source_tank=None):
    """
    Create ledger entries by inheriting composition from source tank.
    
    This implements the proportional inheritance logic:
    - Get current composition of source tank
    - Split the transfer volume proportionally across composition keys
    """
    # Get source tank for composition lookup
    lookup_tank = source_tank if source_tank else tank
    
    # Get current composition of the source tank (before this transfer)
    composition = TankLedger.get_tank_composition(
        lookup_tank,
        as_of=transfer.transfer_date
    )
    
    total_source_volume = composition['total_volume_l']
    
    if total_source_volume <= 0:
        # No composition data - attribute to unknown
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=tank,
            delta_volume_l=volume,
            composition_key_type=CompositionKeyType.UNKNOWN,
            composition_key_id=None,
            composition_key_label='Unknown (No Source Composition)',
            derived_source=DerivedSource.UNKNOWN,
        )
        return
    
    # Handle unknown portion
    if composition['unknown_volume_l'] > 0:
        unknown_proportion = composition['unknown_volume_l'] / total_source_volume
        unknown_volume = volume * unknown_proportion
        
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=tank,
            delta_volume_l=unknown_volume,
            composition_key_type=CompositionKeyType.UNKNOWN,
            composition_key_id=None,
            composition_key_label='Unknown (Inherited)',
            derived_source=DerivedSource.INHERITED,
        )
    
    # Handle batch portions
    for batch_entry in composition['by_batch']:
        if batch_entry['volume_l'] <= 0:
            continue
            
        proportion = batch_entry['volume_l'] / total_source_volume
        batch_volume = volume * proportion
        
        # Skip tiny volumes (< 0.01L)
        if abs(batch_volume) < Decimal('0.01'):
            continue
        
        TankLedger.objects.create(
            winery=transfer.winery,
            transfer=transfer,
            event_datetime=transfer.transfer_date,
            tank=tank,
            delta_volume_l=batch_volume,
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=batch_entry['batch_id'],
            composition_key_label=batch_entry['label'],
            derived_source=DerivedSource.INHERITED,
        )


@receiver(post_delete, sender=Transfer)
def delete_ledger_entries(sender, instance, **kwargs):
    """
    Delete ledger entries when a transfer is deleted.
    
    Note: In a true event-sourced system, we wouldn't delete transfers.
    Instead, we'd create adjustment transfers. This is here for data cleanup.
    """
    TankLedger.objects.filter(transfer=instance).delete()





