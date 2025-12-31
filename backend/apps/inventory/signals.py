from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import MaterialMovement, Addition, MaterialStock


@receiver(post_save, sender=MaterialMovement)
def update_stock_on_movement(sender, instance, created, **kwargs):
    """
    Automatically update MaterialStock when a MaterialMovement is created or updated
    """
    if not created:
        return  # Only process new movements
    
    with transaction.atomic():
        # Get or create stock record for the location
        stock, _ = MaterialStock.objects.get_or_create(
            material=instance.material,
            location=instance.location,
            defaults={'quantity': 0}
        )
        
        # Update stock based on movement type
        if instance.movement_type == 'TRANSFER':
            # For transfers, we need to update both source and destination
            # Decrease from source location
            stock.quantity += instance.quantity  # quantity should be negative for transfers out
            stock.save(update_fields=['quantity'])
            
            # Increase at destination (if specified)
            if instance.destination_location:
                dest_stock, _ = MaterialStock.objects.get_or_create(
                    material=instance.material,
                    location=instance.destination_location,
                    defaults={'quantity': 0}
                )
                dest_stock.quantity += abs(instance.quantity)  # Add positive quantity
                dest_stock.save(update_fields=['quantity'])
        else:
            # For other movement types, just update the stock
            stock.quantity += instance.quantity
            stock.save(update_fields=['quantity'])
        
        # Ensure stock doesn't go negative
        if stock.quantity < 0:
            stock.quantity = 0
            stock.save(update_fields=['quantity'])


@receiver(post_save, sender=Addition)
def create_movement_on_addition(sender, instance, created, **kwargs):
    """
    Automatically create a MaterialMovement (USAGE) when an Addition is made
    This decrements the stock and creates an audit trail
    """
    if not created:
        return  # Only process new additions
    
    # Create a USAGE movement to track the stock reduction
    MaterialMovement.objects.create(
        material=instance.material,
        movement_type='USAGE',
        quantity=-instance.quantity,  # Negative because it's being used
        location='MAIN_STORAGE',  # Default location, could be made configurable
        movement_date=instance.addition_date,
        notes=f"Used in {instance.get_target_display()}: {instance.purpose or 'No purpose specified'}",
        created_by=instance.added_by
    )

