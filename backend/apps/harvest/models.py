"""
Harvest models: HarvestSeason, Batch, BatchSource.

These track grape intake and batch creation during harvest.
"""
import uuid
from datetime import date
from django.db import models
from django.db.models import Sum
from django.core.validators import MinValueValidator


class HarvestSeason(models.Model):
    """
    Represents a harvest year/season.
    Used to group batches and track vintage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='harvest_seasons'
    )
    year = models.IntegerField(help_text='Harvest year (vintage)')
    name = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Optional name for the season (e.g., "2024 Harvest")'
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this is the current active season'
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Harvest Season'
        verbose_name_plural = 'Harvest Seasons'
        ordering = ['-year']
        unique_together = ['winery', 'year']
    
    def __str__(self):
        return self.name or f"Harvest {self.year}"
    
    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"Harvest {self.year}"
        super().save(*args, **kwargs)
    
    @property
    def batch_count(self):
        return self.batches.count()
    
    @property
    def total_grape_weight_kg(self):
        return self.batches.aggregate(
            total=Sum('grape_weight_kg')
        )['total'] or 0


class Batch(models.Model):
    """
    A batch of grapes received during harvest.
    Can come from multiple vineyard sources.
    """
    STAGE_CHOICES = [
        ('INTAKE', 'Intake'),
        ('CRUSHING', 'Crushing'),
        ('FERMENTATION', 'Fermentation'),
        ('POST_FERMENT', 'Post-Fermentation'),
        ('AGING', 'Aging'),
        ('BLENDING', 'Blending'),
        ('BOTTLING', 'Bottling'),
        ('COMPLETE', 'Complete'),
    ]
    
    SOURCE_TYPE_CHOICES = [
        ('OWN', 'Own Vineyard'),
        ('PURCHASED', 'Purchased Grapes'),
        ('MIXED', 'Mixed Sources'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='batches'
    )
    batch_code = models.CharField(
        max_length=50,
        help_text='Auto-generated batch code (e.g., 2024-001)'
    )
    harvest_season = models.ForeignKey(
        HarvestSeason,
        on_delete=models.PROTECT,
        related_name='batches'
    )
    intake_date = models.DateField(default=date.today)
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        default='OWN'
    )
    initial_tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initial_batches',
        help_text='Tank where grapes were initially placed'
    )
    grape_weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Total grape weight in kg'
    )
    must_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Estimated must volume in liters'
    )
    stage = models.CharField(
        max_length=20,
        choices=STAGE_CHOICES,
        default='INTAKE'
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Batch'
        verbose_name_plural = 'Batches'
        ordering = ['-intake_date', '-created_at']
        unique_together = ['winery', 'batch_code']
    
    def __str__(self):
        return f"{self.batch_code}"
    
    def save(self, *args, **kwargs):
        if not self.batch_code:
            self.batch_code = self.generate_batch_code()
        super().save(*args, **kwargs)
    
    def generate_batch_code(self):
        """Generate unique batch code: YYYY-NNN format."""
        year = self.harvest_season.year
        
        # Get the last batch number for this winery and year
        last_batch = Batch.objects.filter(
            winery=self.winery,
            batch_code__startswith=f"{year}-"
        ).order_by('-batch_code').first()
        
        if last_batch:
            try:
                last_num = int(last_batch.batch_code.split('-')[1])
                next_num = last_num + 1
            except (IndexError, ValueError):
                next_num = 1
        else:
            next_num = 1
        
        return f"{year}-{next_num:03d}"
    
    @property
    def source_count(self):
        return self.sources.count()
    
    @property
    def primary_variety(self):
        """Get the primary grape variety (highest weight)."""
        top_source = self.sources.order_by('-weight_kg').first()
        return top_source.variety if top_source else None
    
    @property
    def variety_breakdown(self):
        """Get breakdown of varieties with percentages."""
        total = self.grape_weight_kg or 0
        if total == 0:
            return []
        
        breakdown = []
        for source in self.sources.select_related('variety').all():
            percentage = (source.weight_kg / total) * 100 if total > 0 else 0
            breakdown.append({
                'variety_id': str(source.variety.id) if source.variety else None,
                'variety_name': source.variety.name if source.variety else 'Unknown',
                'weight_kg': float(source.weight_kg),
                'percentage': round(percentage, 1)
            })
        return breakdown


class BatchSource(models.Model):
    """
    Tracks the source of grapes for a batch.
    A batch can have multiple sources (different vineyards/varieties).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='batch_sources'
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='sources'
    )
    vineyard_block = models.ForeignKey(
        'master_data.VineyardBlock',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batch_sources'
    )
    variety = models.ForeignKey(
        'master_data.GrapeVariety',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batch_sources'
    )
    weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Weight in kg from this source'
    )
    is_estimated = models.BooleanField(
        default=False,
        help_text='Whether the weight is estimated vs measured'
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Batch Source'
        verbose_name_plural = 'Batch Sources'
        ordering = ['-weight_kg']
    
    def __str__(self):
        variety_name = self.variety.name if self.variety else 'Unknown'
        return f"{self.batch.batch_code} - {variety_name} ({self.weight_kg}kg)"
    
    def save(self, *args, **kwargs):
        # Ensure winery matches batch's winery
        if self.batch:
            self.winery = self.batch.winery
        super().save(*args, **kwargs)
        
        # Update batch total weight
        self.batch.grape_weight_kg = self.batch.sources.aggregate(
            total=Sum('weight_kg')
        )['total'] or 0
        self.batch.save(update_fields=['grape_weight_kg'])






