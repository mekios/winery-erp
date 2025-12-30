"""
Tank Ledger models for tracking wine composition.

The TankLedger decomposes transfer events into composition entries,
allowing us to track what's in each tank by batch, variety, and vineyard.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator


class CompositionKeyType(models.TextChoices):
    """Types of composition keys for the ledger."""
    BATCH = 'BATCH', 'Batch'
    WINE_LOT = 'WINE_LOT', 'Wine Lot'
    UNKNOWN = 'UNKNOWN', 'Unknown'


class DerivedSource(models.TextChoices):
    """How the ledger entry was derived."""
    EXPLICIT = 'EXPLICIT', 'Explicit Attribution'  # Transfer had batch_id specified
    INHERITED = 'INHERITED', 'Inherited from Source'  # Proportionally inherited from source tank
    UNKNOWN = 'UNKNOWN', 'Unknown Source'  # No source composition available


class TankLedger(models.Model):
    """
    Tracks wine composition changes in tanks.
    
    Each transfer creates one or more ledger entries:
    - If transfer has explicit batch_id: single entry with that batch
    - If transfer has no batch_id: entries proportional to source tank composition
    - If source has no composition: entry with UNKNOWN key
    
    The ledger is append-only. Current composition is computed by summing
    delta_volume_l for each composition_key in a tank.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='tank_ledger_entries'
    )
    
    # Link to the source event (either transfer or batch intake)
    transfer = models.ForeignKey(
        'production.Transfer',
        on_delete=models.CASCADE,
        related_name='ledger_entries',
        null=True,
        blank=True,
        help_text='The transfer event that created this entry'
    )
    batch = models.ForeignKey(
        'harvest.Batch',
        on_delete=models.CASCADE,
        related_name='ledger_entries',
        null=True,
        blank=True,
        help_text='The batch intake event that created this entry'
    )
    event_datetime = models.DateTimeField(
        help_text='Timestamp of the original transfer or batch intake'
    )
    
    # Tank being affected
    tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.CASCADE,
        related_name='ledger_entries'
    )
    
    # Volume change (positive = in, negative = out)
    delta_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Volume change in liters (positive=in, negative=out)'
    )
    
    # Composition key (what this volume represents)
    composition_key_type = models.CharField(
        max_length=20,
        choices=CompositionKeyType.choices,
        default=CompositionKeyType.BATCH
    )
    composition_key_id = models.UUIDField(
        null=True,
        blank=True,
        help_text='UUID of the batch or wine lot (null for UNKNOWN)'
    )
    composition_key_label = models.CharField(
        max_length=100,
        blank=True,
        help_text='Human-readable label for the composition key'
    )
    
    # How this entry was derived
    derived_source = models.CharField(
        max_length=20,
        choices=DerivedSource.choices,
        default=DerivedSource.EXPLICIT
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['event_datetime', 'created_at']
        indexes = [
            models.Index(fields=['winery', 'tank', 'event_datetime']),
            models.Index(fields=['tank', 'composition_key_type', 'composition_key_id']),
            models.Index(fields=['transfer']),
        ]
        verbose_name = 'Tank Ledger Entry'
        verbose_name_plural = 'Tank Ledger Entries'
    
    def __str__(self):
        direction = '+' if self.delta_volume_l > 0 else ''
        return f"{self.tank.code}: {direction}{self.delta_volume_l}L [{self.composition_key_label}]"
    
    @classmethod
    def get_tank_composition(cls, tank, as_of=None):
        """
        Calculate current composition of a tank.
        
        Returns dict of:
        {
            'total_volume_l': Decimal,
            'by_batch': [{'batch_id': uuid, 'label': str, 'volume_l': Decimal, 'percentage': Decimal}],
            'by_variety': [{'variety': str, 'volume_l': Decimal, 'percentage': Decimal}],
            'by_vineyard': [{'vineyard': str, 'grower': str, 'volume_l': Decimal, 'percentage': Decimal}],
            'unknown_volume_l': Decimal,
            'has_integrity_issues': bool,
        }
        """
        from django.db.models import Sum, F
        from apps.harvest.models import Batch
        
        # Get ledger entries for this tank
        entries = cls.objects.filter(tank=tank)
        if as_of:
            entries = entries.filter(event_datetime__lte=as_of)
        
        # Aggregate by composition key
        composition = entries.values(
            'composition_key_type',
            'composition_key_id',
            'composition_key_label'
        ).annotate(
            volume=Sum('delta_volume_l')
        )
        
        total_volume = Decimal('0')
        unknown_volume = Decimal('0')
        by_batch = []
        has_integrity_issues = False
        
        for entry in composition:
            volume = entry['volume'] or Decimal('0')
            
            # Check for negative volumes (integrity issue)
            if volume < 0:
                has_integrity_issues = True
            
            total_volume += volume
            
            if entry['composition_key_type'] == CompositionKeyType.UNKNOWN:
                unknown_volume += volume
            elif entry['composition_key_type'] == CompositionKeyType.BATCH:
                by_batch.append({
                    'batch_id': entry['composition_key_id'],
                    'label': entry['composition_key_label'],
                    'volume_l': volume,
                })
        
        # Calculate percentages and get variety/vineyard breakdown
        by_variety = {}
        by_vineyard = {}
        
        for batch_entry in by_batch:
            if total_volume > 0:
                batch_entry['percentage'] = round(
                    (batch_entry['volume_l'] / total_volume) * 100, 2
                )
            else:
                batch_entry['percentage'] = Decimal('0')
            
            # Get batch details for variety/vineyard breakdown
            try:
                batch = Batch.objects.prefetch_related(
                    'sources__variety', 'sources__vineyard_block__grower'
                ).get(id=batch_entry['batch_id'])
                
                for source in batch.sources.all():
                    # Calculate proportional volume from this batch
                    source_proportion = Decimal('1')
                    total_batch_weight = sum(s.weight_kg for s in batch.sources.all())
                    if total_batch_weight > 0:
                        source_proportion = Decimal(str(source.weight_kg)) / Decimal(str(total_batch_weight))
                    
                    source_volume = batch_entry['volume_l'] * source_proportion
                    
                    # Variety breakdown
                    variety_name = source.variety.name
                    if variety_name in by_variety:
                        by_variety[variety_name] += source_volume
                    else:
                        by_variety[variety_name] = source_volume
                    
                    # Vineyard breakdown
                    if source.vineyard_block:
                        vineyard_key = f"{source.vineyard_block.name}|{source.vineyard_block.grower.name if source.vineyard_block.grower else 'Unknown'}"
                        if vineyard_key in by_vineyard:
                            by_vineyard[vineyard_key]['volume_l'] += source_volume
                        else:
                            by_vineyard[vineyard_key] = {
                                'vineyard': source.vineyard_block.name,
                                'grower': source.vineyard_block.grower.name if source.vineyard_block.grower else 'Unknown',
                                'volume_l': source_volume,
                            }
            except Batch.DoesNotExist:
                pass
        
        # Convert variety dict to list with percentages
        variety_list = []
        for variety_name, volume in by_variety.items():
            variety_list.append({
                'variety': variety_name,
                'volume_l': volume,
                'percentage': round((volume / total_volume) * 100, 2) if total_volume > 0 else Decimal('0'),
            })
        variety_list.sort(key=lambda x: x['volume_l'], reverse=True)
        
        # Convert vineyard dict to list with percentages
        vineyard_list = []
        for key, data in by_vineyard.items():
            vineyard_list.append({
                'vineyard': data['vineyard'],
                'grower': data['grower'],
                'volume_l': data['volume_l'],
                'percentage': round((data['volume_l'] / total_volume) * 100, 2) if total_volume > 0 else Decimal('0'),
            })
        vineyard_list.sort(key=lambda x: x['volume_l'], reverse=True)
        
        return {
            'total_volume_l': total_volume,
            'by_batch': sorted(by_batch, key=lambda x: x['volume_l'], reverse=True),
            'by_variety': variety_list,
            'by_vineyard': vineyard_list,
            'unknown_volume_l': unknown_volume,
            'unknown_percentage': round((unknown_volume / total_volume) * 100, 2) if total_volume > 0 else Decimal('0'),
            'has_integrity_issues': has_integrity_issues or unknown_volume > 0,
        }





