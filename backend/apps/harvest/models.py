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
        help_text='Must volume in liters'
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
        """
        Generate unique batch code: YYYY-MMDD-HHMM format.
        Uses timestamp to ensure uniqueness without database queries or locks.
        Example: 2025-0205-1430 (Feb 5, 2025 at 2:30 PM)
        """
        from django.utils import timezone
        now = timezone.now()
        return f"{now.year}-{now.month:02d}{now.day:02d}-{now.hour:02d}{now.minute:02d}"
    
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


class BatchFraction(models.Model):
    """
    Represents a fraction/portion of a batch (e.g., free run, 1st press, 2nd press).
    Each fraction can be stored in a different tank and tracked separately.
    
    This allows tracking the different quality levels from pressing operations:
    - Free Run: Juice that flows naturally before pressing
    - 1st Press: Light pressing
    - 2nd Press: Medium pressing
    - 3rd Press: Hard pressing
    
    All fractions maintain traceability to the parent batch for composition tracking.
    """
    FRACTION_TYPE_CHOICES = [
        ('FREE_RUN', 'Free Run'),
        ('PRESS_1', '1st Press'),
        ('PRESS_2', '2nd Press'),
        ('PRESS_3', '3rd Press'),
        ('SKIN_CONTACT', 'Skin Contact'),
        ('SETTLING', 'Settling'),
        ('RACKING', 'Racking'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='batch_fractions'
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='fractions',
        help_text='Parent batch this fraction belongs to'
    )
    
    fraction_type = models.CharField(
        max_length=20,
        choices=FRACTION_TYPE_CHOICES,
        help_text='Type of fraction (e.g., Free Run, Press)'
    )
    fraction_code = models.CharField(
        max_length=50,
        blank=True,
        help_text='Auto-generated code (e.g., 2024-001-FR, 2024-001-P1)'
    )
    
    tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batch_fractions',
        help_text='Current tank storing this fraction'
    )
    volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Volume in liters'
    )
    
    separation_datetime = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When this fraction was separated/pressed'
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Batch Fraction'
        verbose_name_plural = 'Batch Fractions'
        ordering = ['batch', 'separation_datetime', 'fraction_type']
        unique_together = ['winery', 'fraction_code']
    
    def __str__(self):
        return f"{self.fraction_code or self.batch.batch_code} - {self.get_fraction_type_display()}"
    
    def save(self, *args, **kwargs):
        # Ensure winery matches batch's winery
        if self.batch:
            self.winery = self.batch.winery
        
        # Generate fraction code if not set
        if not self.fraction_code:
            self.fraction_code = self.generate_fraction_code()
        
        super().save(*args, **kwargs)
    
    def generate_fraction_code(self):
        """Generate unique fraction code based on batch code and type."""
        # Map fraction types to short codes
        type_codes = {
            'FREE_RUN': 'FR',
            'PRESS_1': 'P1',
            'PRESS_2': 'P2',
            'PRESS_3': 'P3',
            'SKIN_CONTACT': 'SC',
            'SETTLING': 'ST',
            'RACKING': 'RK',
            'OTHER': 'OT',
        }
        
        type_code = type_codes.get(self.fraction_type, 'XX')
        base_code = f"{self.batch.batch_code}-{type_code}"
        
        # Check if we need to add a number suffix (for duplicate types)
        existing = BatchFraction.objects.filter(
            winery=self.winery,
            batch=self.batch,
            fraction_type=self.fraction_type
        ).exclude(id=self.id).count()
        
        if existing > 0:
            return f"{base_code}{existing + 1}"
        
        return base_code











