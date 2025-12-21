import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Analysis(models.Model):
    """
    Lab analysis record for wine samples.
    
    Can be linked to a tank, barrel, wine lot, or batch.
    Contains all common wine analysis parameters with validation ranges.
    """
    
    class SampleType(models.TextChoices):
        TANK = 'TANK', 'Tank'
        BARREL = 'BARREL', 'Barrel'
        WINE_LOT = 'WINE_LOT', 'Wine Lot'
        BATCH = 'BATCH', 'Batch'
        BLEND = 'BLEND', 'Blend Sample'
        BOTTLE = 'BOTTLE', 'Bottle'
        OTHER = 'OTHER', 'Other'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='analyses'
    )
    
    # Sample source - at least one should be set
    sample_type = models.CharField(
        max_length=20,
        choices=SampleType.choices,
        default=SampleType.TANK
    )
    tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='analyses'
    )
    barrel = models.ForeignKey(
        'equipment.Barrel',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='analyses'
    )
    wine_lot = models.ForeignKey(
        'production.WineLot',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='analyses'
    )
    batch = models.ForeignKey(
        'harvest.Batch',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='analyses'
    )
    
    # Timing
    analysis_date = models.DateTimeField(default=timezone.now)
    sample_date = models.DateTimeField(null=True, blank=True, help_text="When sample was taken (if different)")
    
    # Temperature at sampling
    temperature_c = models.DecimalField(
        max_digits=4, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(-10), MaxValueValidator(50)],
        help_text="Sample temperature in Celsius"
    )
    
    # === BASIC PARAMETERS ===
    
    # pH (typical range 2.8 - 4.2)
    ph = models.DecimalField(
        max_digits=4, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('2.0')), MaxValueValidator(Decimal('5.0'))],
        help_text="pH value (2.0 - 5.0)"
    )
    
    # Titratable Acidity (g/L, typical range 4-10)
    ta_gl = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('20'))],
        help_text="Titratable acidity in g/L (as tartaric)"
    )
    
    # Volatile Acidity (g/L, typical < 0.6 for white, < 0.8 for red)
    va_gl = models.DecimalField(
        max_digits=4, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('3'))],
        help_text="Volatile acidity in g/L (as acetic)"
    )
    
    # === SUGAR & DENSITY ===
    
    # Brix (degrees, sugar content indicator)
    brix = models.DecimalField(
        max_digits=5, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('-5')), MaxValueValidator(Decimal('40'))],
        help_text="Brix degrees (sugar content)"
    )
    
    # Density / Specific Gravity (typically 0.990 - 1.100)
    density = models.DecimalField(
        max_digits=6, decimal_places=4,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.9')), MaxValueValidator(Decimal('1.2'))],
        help_text="Density/specific gravity at 20°C"
    )
    
    # Residual Sugar (g/L)
    residual_sugar_gl = models.DecimalField(
        max_digits=6, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('400'))],
        help_text="Residual sugar in g/L"
    )
    
    # === SULFUR DIOXIDE ===
    
    # Free SO₂ (mg/L)
    free_so2_mgl = models.DecimalField(
        max_digits=5, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('200'))],
        help_text="Free SO₂ in mg/L"
    )
    
    # Total SO₂ (mg/L)
    total_so2_mgl = models.DecimalField(
        max_digits=5, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('400'))],
        help_text="Total SO₂ in mg/L"
    )
    
    # === ALCOHOL ===
    
    # Alcohol % by volume (measured or computed)
    alcohol_abv = models.DecimalField(
        max_digits=4, decimal_places=1,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('25'))],
        help_text="Alcohol % by volume"
    )
    
    # === ORGANIC ACIDS (optional, detailed analysis) ===
    
    # Malic Acid (g/L) - tracks MLF progress
    malic_acid_gl = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))],
        help_text="Malic acid in g/L"
    )
    
    # Lactic Acid (g/L) - tracks MLF progress
    lactic_acid_gl = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))],
        help_text="Lactic acid in g/L"
    )
    
    # Tartaric Acid (g/L)
    tartaric_acid_gl = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))],
        help_text="Tartaric acid in g/L"
    )
    
    # Citric Acid (g/L)
    citric_acid_gl = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('3'))],
        help_text="Citric acid in g/L"
    )
    
    # === COLOR (optional) ===
    
    # Color Intensity (A420 + A520 + A620 for reds)
    color_intensity = models.DecimalField(
        max_digits=6, decimal_places=3,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('30'))],
        help_text="Color intensity (sum of absorbances)"
    )
    
    # Hue (A420/A520 ratio)
    color_hue = models.DecimalField(
        max_digits=4, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))],
        help_text="Color hue (A420/A520)"
    )
    
    # === METADATA ===
    
    analyzed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='analyses_performed'
    )
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Analysis'
        verbose_name_plural = 'Analyses'
        ordering = ['-analysis_date']
        indexes = [
            models.Index(fields=['winery', '-analysis_date']),
            models.Index(fields=['tank', '-analysis_date']),
            models.Index(fields=['barrel', '-analysis_date']),
            models.Index(fields=['wine_lot', '-analysis_date']),
            models.Index(fields=['batch', '-analysis_date']),
        ]
    
    def __str__(self):
        source = self.get_source_display()
        date_str = self.analysis_date.strftime('%Y-%m-%d')
        return f"Analysis: {source} ({date_str})"
    
    def get_source_display(self):
        """Return a human-readable source description."""
        if self.tank:
            return f"Tank {self.tank.code}"
        elif self.barrel:
            return f"Barrel {self.barrel.code}"
        elif self.wine_lot:
            return f"Lot {self.wine_lot.lot_code}"
        elif self.batch:
            return f"Batch {self.batch.batch_code}"
        return "Unknown source"
    
    @property
    def molecular_so2(self):
        """
        Calculate molecular SO₂ from free SO₂ and pH.
        
        Formula: Molecular SO₂ = Free SO₂ / (1 + 10^(pH - 1.81))
        Molecular SO₂ is the active antimicrobial form.
        Target: 0.8 mg/L for whites, 0.5-0.6 mg/L for reds.
        """
        if self.free_so2_mgl is None or self.ph is None:
            return None
        
        try:
            denominator = 1 + (10 ** (float(self.ph) - 1.81))
            return round(float(self.free_so2_mgl) / denominator, 2)
        except (ValueError, ZeroDivisionError):
            return None
    
    @property
    def potential_alcohol(self):
        """
        Estimate potential alcohol from Brix.
        
        Rule of thumb: Brix × 0.55 = approximate potential alcohol %.
        More accurate: (Brix × 1.8) / 3.2 or Brix × 0.5625
        """
        if self.brix is None:
            return None
        
        return round(float(self.brix) * 0.55, 1)
    
    @property
    def bound_so2(self):
        """Calculate bound SO₂ (Total - Free)."""
        if self.total_so2_mgl is None or self.free_so2_mgl is None:
            return None
        return float(self.total_so2_mgl) - float(self.free_so2_mgl)
    
    @property
    def mlf_progress(self):
        """
        Estimate MLF (malolactic fermentation) progress.
        
        Based on malic acid levels:
        - > 2.0 g/L: Not started or early
        - 0.5 - 2.0 g/L: In progress
        - < 0.5 g/L: Complete (or nearly)
        """
        if self.malic_acid_gl is None:
            return None
        
        malic = float(self.malic_acid_gl)
        if malic > 2.0:
            return 'NOT_STARTED'
        elif malic > 0.5:
            return 'IN_PROGRESS'
        else:
            return 'COMPLETE'




