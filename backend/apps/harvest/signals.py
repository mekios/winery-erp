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

