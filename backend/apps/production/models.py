import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

from apps.wineries.models import Winery
from apps.equipment.models import Tank, Barrel
from apps.harvest.models import Batch


class TransferActionType(models.TextChoices):
    """Types of transfer actions."""
    FILL = 'FILL', 'Fill Tank'          # Initial fill from harvest
    RACK = 'RACK', 'Racking'             # Transfer to remove sediment
    BLEND = 'BLEND', 'Blending'          # Combine multiple sources
    TOP_UP = 'TOP_UP', 'Topping Up'      # Small addition to fill headspace
    DRAIN = 'DRAIN', 'Drain'             # Remove wine from tank
    BARREL_FILL = 'BARREL_FILL', 'Barrel Fill'  # Tank to barrel
    BARREL_EMPTY = 'BARREL_EMPTY', 'Barrel Empty'  # Barrel to tank
    BARREL_RACK = 'BARREL_RACK', 'Barrel Racking'  # Barrel to barrel
    FILTER = 'FILTER', 'Filtration'      # Transfer through filter
    BOTTLE = 'BOTTLE', 'Bottling'        # Final transfer to bottles


class Transfer(models.Model):
    """
    Records volume movement between tanks, barrels, or to/from external.
    This is the core event-sourcing model for wine movement.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        Winery,
        on_delete=models.CASCADE,
        related_name='transfers'
    )
    
    # Transfer details
    action_type = models.CharField(
        max_length=20,
        choices=TransferActionType.choices,
        default=TransferActionType.RACK
    )
    transfer_date = models.DateTimeField(default=timezone.now)
    
    # Source (one of these should be set, or null for external source)
    source_tank = models.ForeignKey(
        Tank,
        on_delete=models.PROTECT,
        related_name='transfers_out',
        null=True,
        blank=True
    )
    source_barrel = models.ForeignKey(
        Barrel,
        on_delete=models.PROTECT,
        related_name='transfers_out',
        null=True,
        blank=True
    )
    
    # Destination (one of these should be set, or null for external dest like bottling)
    destination_tank = models.ForeignKey(
        Tank,
        on_delete=models.PROTECT,
        related_name='transfers_in',
        null=True,
        blank=True
    )
    destination_barrel = models.ForeignKey(
        Barrel,
        on_delete=models.PROTECT,
        related_name='transfers_in',
        null=True,
        blank=True
    )
    
    # Volume and measurements
    volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Volume transferred in liters'
    )
    temperature_c = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text='Temperature at transfer in Celsius'
    )
    
    # Optional batch/lot tracking
    batch = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        related_name='transfers',
        null=True,
        blank=True,
        help_text='Explicit batch attribution for this transfer'
    )
    wine_lot = models.ForeignKey(
        'WineLot',
        on_delete=models.SET_NULL,
        related_name='transfers',
        null=True,
        blank=True,
        help_text='Wine lot this transfer belongs to'
    )
    
    # Metadata
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_performed'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transfer_date']
        indexes = [
            models.Index(fields=['winery', '-transfer_date']),
            models.Index(fields=['source_tank']),
            models.Index(fields=['destination_tank']),
        ]
    
    def __str__(self):
        source = self.source_tank or self.source_barrel or 'External'
        dest = self.destination_tank or self.destination_barrel or 'External'
        return f"{self.action_type}: {source} → {dest} ({self.volume_l}L)"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate source exists for most action types
        if self.action_type not in [TransferActionType.FILL]:
            if not self.source_tank and not self.source_barrel:
                raise ValidationError('Source tank or barrel is required for this action type.')
        
        # Validate destination exists for most action types
        if self.action_type not in [TransferActionType.DRAIN, TransferActionType.BOTTLE]:
            if not self.destination_tank and not self.destination_barrel:
                raise ValidationError('Destination tank or barrel is required for this action type.')
        
        # Validate same winery
        if self.source_tank and self.source_tank.winery != self.winery:
            raise ValidationError('Source tank must belong to the same winery.')
        if self.destination_tank and self.destination_tank.winery != self.winery:
            raise ValidationError('Destination tank must belong to the same winery.')
        if self.source_barrel and self.source_barrel.winery != self.winery:
            raise ValidationError('Source barrel must belong to the same winery.')
        if self.destination_barrel and self.destination_barrel.winery != self.winery:
            raise ValidationError('Destination barrel must belong to the same winery.')


class WineLotStatus(models.TextChoices):
    """Status of a wine lot."""
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    AGING = 'AGING', 'Aging'
    READY = 'READY', 'Ready for Bottling'
    BOTTLED = 'BOTTLED', 'Bottled'
    SOLD = 'SOLD', 'Sold Out'


class WineLot(models.Model):
    """
    Represents a finished or in-progress wine lot.
    A lot can be linked to multiple batches with different proportions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        Winery,
        on_delete=models.CASCADE,
        related_name='wine_lots'
    )
    
    # Identification
    lot_code = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    vintage = models.PositiveIntegerField(
        help_text='Vintage year (e.g., 2024)'
    )
    
    # Wine details
    wine_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='e.g., Cabernet Sauvignon, Rosé Blend'
    )
    status = models.CharField(
        max_length=20,
        choices=WineLotStatus.choices,
        default=WineLotStatus.IN_PROGRESS
    )
    
    # Volume tracking
    initial_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
        help_text='Initial volume when lot was created'
    )
    current_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
        help_text='Current remaining volume'
    )
    
    # Current location (primary tank/barrel holding this lot)
    current_tank = models.ForeignKey(
        Tank,
        on_delete=models.SET_NULL,
        related_name='wine_lots',
        null=True,
        blank=True
    )
    current_barrel = models.ForeignKey(
        Barrel,
        on_delete=models.SET_NULL,
        related_name='wine_lots',
        null=True,
        blank=True
    )
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-vintage', 'lot_code']
        unique_together = ['winery', 'lot_code']
        indexes = [
            models.Index(fields=['winery', 'status']),
            models.Index(fields=['vintage']),
        ]
    
    def __str__(self):
        return f"{self.lot_code} - {self.name} ({self.vintage})"
    
    @property
    def batch_varieties(self):
        """Get variety breakdown from linked batches."""
        varieties = {}
        for link in self.batch_links.all():
            for source in link.batch.sources.all():
                variety_name = source.variety.name
                if variety_name in varieties:
                    varieties[variety_name] += float(source.weight_kg)
                else:
                    varieties[variety_name] = float(source.weight_kg)
        return varieties


class LotBatchLink(models.Model):
    """
    Links a wine lot to its source batches with proportions.
    This tracks the composition/provenance of blended wines.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    wine_lot = models.ForeignKey(
        WineLot,
        on_delete=models.CASCADE,
        related_name='batch_links'
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.PROTECT,
        related_name='lot_links'
    )
    
    # Volume from this batch used in the lot
    volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Volume from this batch in the lot'
    )
    
    # Percentage of the lot (computed or explicit)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text='Percentage of lot from this batch'
    )
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['wine_lot', 'batch']
        ordering = ['-percentage']
    
    def __str__(self):
        return f"{self.wine_lot.lot_code} ← {self.batch.batch_code} ({self.percentage or '?'}%)"
