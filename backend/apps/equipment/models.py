"""
Equipment models: Tank, Barrel, Equipment.

These are the physical vessels and equipment used in winemaking.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator


class Tank(models.Model):
    """
    Wine tanks for fermentation and storage.
    The primary vessel for tracking wine production.
    """
    TANK_TYPE_CHOICES = [
        ('FERMENTATION', 'Fermentation'),
        ('STORAGE', 'Storage'),
        ('BLENDING', 'Blending'),
        ('SETTLING', 'Settling'),
        ('TEMPERATURE_CONTROL', 'Temperature Control'),
    ]
    
    MATERIAL_CHOICES = [
        ('STAINLESS', 'Stainless Steel'),
        ('CONCRETE', 'Concrete'),
        ('FIBERGLASS', 'Fiberglass'),
        ('OAK', 'Oak'),
        ('PLASTIC', 'Food-Grade Plastic'),
    ]
    
    STATUS_CHOICES = [
        ('EMPTY', 'Empty'),
        ('IN_USE', 'In Use'),
        ('CLEANING', 'Cleaning'),
        ('MAINTENANCE', 'Maintenance'),
        ('OUT_OF_SERVICE', 'Out of Service'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='tanks'
    )
    code = models.CharField(max_length=20, help_text='Unique tank identifier (e.g., A01, B12)')
    name = models.CharField(max_length=100, blank=True)
    tank_type = models.CharField(max_length=30, choices=TANK_TYPE_CHOICES, default='STORAGE')
    material = models.CharField(max_length=20, choices=MATERIAL_CHOICES, default='STAINLESS')
    capacity_l = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Maximum capacity in liters'
    )
    current_volume_l = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current volume in liters'
    )
    location = models.CharField(max_length=100, blank=True, help_text='Physical location in winery')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EMPTY')
    has_cooling = models.BooleanField(default=False)
    has_heating = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tank'
        verbose_name_plural = 'Tanks'
        ordering = ['code']
        unique_together = ['winery', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}" if self.name else self.code
    
    @property
    def fill_percentage(self):
        """Calculate current fill percentage."""
        if self.capacity_l > 0:
            return round((self.current_volume_l / self.capacity_l) * 100, 1)
        return 0
    
    @property
    def available_capacity_l(self):
        """Calculate available capacity."""
        return self.capacity_l - self.current_volume_l


class Barrel(models.Model):
    """
    Wine barrels for aging.
    Tracks wood type, age, and usage history.
    """
    WOOD_TYPE_CHOICES = [
        ('FRENCH_OAK', 'French Oak'),
        ('AMERICAN_OAK', 'American Oak'),
        ('HUNGARIAN_OAK', 'Hungarian Oak'),
        ('ACACIA', 'Acacia'),
        ('CHESTNUT', 'Chestnut'),
        ('OTHER', 'Other'),
    ]
    
    TOAST_LEVEL_CHOICES = [
        ('LIGHT', 'Light'),
        ('MEDIUM', 'Medium'),
        ('MEDIUM_PLUS', 'Medium Plus'),
        ('HEAVY', 'Heavy'),
    ]
    
    STATUS_CHOICES = [
        ('EMPTY', 'Empty'),
        ('IN_USE', 'In Use'),
        ('CONDITIONING', 'Conditioning'),
        ('RETIRED', 'Retired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='barrels'
    )
    code = models.CharField(max_length=20, help_text='Unique barrel identifier')
    volume_l = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=225,
        validators=[MinValueValidator(0)],
        help_text='Capacity in liters (standard: 225L)'
    )
    current_volume_l = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    wood_type = models.CharField(max_length=20, choices=WOOD_TYPE_CHOICES, default='FRENCH_OAK')
    toast_level = models.CharField(max_length=20, choices=TOAST_LEVEL_CHOICES, default='MEDIUM')
    cooper = models.CharField(max_length=100, blank=True, help_text='Barrel manufacturer')
    vintage_year = models.IntegerField(
        null=True,
        blank=True,
        help_text='Year the barrel was made'
    )
    first_use_year = models.IntegerField(
        null=True,
        blank=True,
        help_text='First year used for wine'
    )
    use_count = models.IntegerField(default=0, help_text='Number of times used')
    location = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EMPTY')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Barrel'
        verbose_name_plural = 'Barrels'
        ordering = ['code']
        unique_together = ['winery', 'code']
    
    def __str__(self):
        return f"{self.code} ({self.wood_type})"
    
    @property
    def age_years(self):
        """Calculate barrel age based on vintage year."""
        if self.vintage_year:
            from datetime import date
            return date.today().year - self.vintage_year
        return None


class Equipment(models.Model):
    """
    General winery equipment (pumps, presses, filters, etc.).
    Used for tracking maintenance and usage.
    """
    EQUIPMENT_TYPE_CHOICES = [
        ('PUMP', 'Pump'),
        ('PRESS', 'Press'),
        ('FILTER', 'Filter'),
        ('CRUSHER', 'Crusher/Destemmer'),
        ('BOTTLING', 'Bottling Line'),
        ('LABELER', 'Labeler'),
        ('FORKLIFT', 'Forklift'),
        ('TEMPERATURE', 'Temperature Control'),
        ('MEASUREMENT', 'Measurement'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('IN_USE', 'In Use'),
        ('MAINTENANCE', 'Maintenance'),
        ('OUT_OF_SERVICE', 'Out of Service'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='equipment'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    equipment_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPE_CHOICES, default='OTHER')
    manufacturer = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    capacity = models.CharField(max_length=50, blank=True, help_text='Capacity/throughput description')
    location = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    last_maintenance = models.DateField(null=True, blank=True)
    next_maintenance = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Equipment'
        verbose_name_plural = 'Equipment'
        ordering = ['name']
        unique_together = ['winery', 'code']
    
    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name




