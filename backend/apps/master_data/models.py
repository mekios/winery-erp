"""
Master Data models: GrapeVariety, Grower, VineyardBlock.

These are the foundational reference data for tracking grape sources.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator


class GrapeVariety(models.Model):
    """
    Grape variety definitions (e.g., Cabernet Sauvignon, Chardonnay).
    Scoped to winery for custom naming.
    """
    COLOR_CHOICES = [
        ('RED', 'Red'),
        ('WHITE', 'White'),
        ('ROSE', 'Rosé'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='grape_varieties'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=10, choices=COLOR_CHOICES, default='RED')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Grape Variety'
        verbose_name_plural = 'Grape Varieties'
        ordering = ['name']
        unique_together = [['winery', 'name'], ['winery', 'code']]
    
    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate code from name if not provided
        if not self.code:
            self.code = self.name[:3].upper()
        super().save(*args, **kwargs)


class Grower(models.Model):
    """
    Grape growers/suppliers who provide grapes to the winery.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='growers'
    )
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Grower'
        verbose_name_plural = 'Growers'
        ordering = ['name']
        unique_together = ['winery', 'name']
    
    def __str__(self):
        return self.name


class VineyardBlock(models.Model):
    """
    Vineyard blocks - specific vineyard areas that supply grapes.
    Linked to a grower and optionally to a primary grape variety.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='vineyard_blocks'
    )
    grower = models.ForeignKey(
        Grower,
        on_delete=models.CASCADE,
        related_name='vineyard_blocks'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    region = models.CharField(max_length=100, blank=True)
    subregion = models.CharField(max_length=100, blank=True)
    area_ha = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Area in hectares'
    )
    elevation_m = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Elevation in meters'
    )
    primary_variety = models.ForeignKey(
        GrapeVariety,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_blocks'
    )
    soil_type = models.CharField(max_length=100, blank=True)
    year_planted = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vineyard Block'
        verbose_name_plural = 'Vineyard Blocks'
        ordering = ['grower__name', 'name']
        unique_together = ['winery', 'code']
    
    def __str__(self):
        return f"{self.grower.name} - {self.name}"






