from django.db import models
from django.core.validators import MinValueValidator
from apps.wineries.models import Winery
from apps.users.models import User
import uuid


class MaterialCategory(models.TextChoices):
    """Categories for winery materials"""
    ADDITIVE = 'ADDITIVE', 'Additive'
    STABILIZER = 'STABILIZER', 'Stabilizer'
    FINING_AGENT = 'FINING_AGENT', 'Fining Agent'
    YEAST = 'YEAST', 'Yeast'
    NUTRIENT = 'NUTRIENT', 'Nutrient'
    ENZYME = 'ENZYME', 'Enzyme'
    ACID = 'ACID', 'Acid'
    TANNIN = 'TANNIN', 'Tannin'
    OAK = 'OAK', 'Oak Product'
    CLEANING = 'CLEANING', 'Cleaning Agent'
    PACKAGING = 'PACKAGING', 'Packaging Material'
    OTHER = 'OTHER', 'Other'


class MaterialUnit(models.TextChoices):
    """Units of measurement for materials"""
    GRAM = 'g', 'Gram'
    KILOGRAM = 'kg', 'Kilogram'
    MILLILITER = 'ml', 'Milliliter'
    LITER = 'l', 'Liter'
    UNIT = 'unit', 'Unit'
    PACK = 'pack', 'Pack'


class Material(models.Model):
    """
    Winery materials/supplies (SO₂, yeast, enzymes, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        Winery, 
        on_delete=models.CASCADE, 
        related_name='materials',
        help_text='Winery that owns this material'
    )
    
    # Basic info
    name = models.CharField(max_length=200, help_text='Material name (e.g., Potassium Metabisulfite)')
    code = models.CharField(max_length=50, blank=True, help_text='Optional SKU/product code')
    category = models.CharField(
        max_length=20, 
        choices=MaterialCategory.choices,
        help_text='Material category'
    )
    
    # Specifications
    unit = models.CharField(
        max_length=10, 
        choices=MaterialUnit.choices,
        help_text='Unit of measurement'
    )
    supplier = models.CharField(max_length=200, blank=True, help_text='Supplier name')
    notes = models.TextField(blank=True, help_text='Additional notes, specifications')
    
    # Stock management
    low_stock_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text='Alert when stock falls below this level'
    )
    
    # Tracking
    is_active = models.BooleanField(default=True, help_text='Is this material still in use?')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_material'
        ordering = ['name']
        unique_together = ['winery', 'code']
        indexes = [
            models.Index(fields=['winery', 'category']),
            models.Index(fields=['winery', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
    
    def get_current_stock(self):
        """Calculate current total stock across all locations"""
        total = self.stock_locations.aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
        return total
    
    def is_low_stock(self):
        """Check if current stock is below threshold"""
        if self.low_stock_threshold is None:
            return False
        return self.get_current_stock() < self.low_stock_threshold


class StockLocation(models.TextChoices):
    """Storage locations for materials"""
    MAIN_STORAGE = 'MAIN_STORAGE', 'Main Storage'
    CELLAR = 'CELLAR', 'Cellar'
    LAB = 'LAB', 'Laboratory'
    BOTTLING_LINE = 'BOTTLING_LINE', 'Bottling Line'
    WAREHOUSE = 'WAREHOUSE', 'Warehouse'
    OTHER = 'OTHER', 'Other'


class MaterialStock(models.Model):
    """
    Current stock levels by material and location
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='stock_locations',
        help_text='Material'
    )
    location = models.CharField(
        max_length=20,
        choices=StockLocation.choices,
        default=StockLocation.MAIN_STORAGE,
        help_text='Storage location'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(0)],
        default=0,
        help_text='Current quantity in stock'
    )
    
    # Tracking
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_material_stock'
        unique_together = ['material', 'location']
        indexes = [
            models.Index(fields=['material', 'location']),
        ]
    
    def __str__(self):
        return f"{self.material.name} @ {self.get_location_display()}: {self.quantity} {self.material.unit}"


class MovementType(models.TextChoices):
    """Types of stock movements"""
    PURCHASE = 'PURCHASE', 'Purchase/Delivery'
    ADJUSTMENT = 'ADJUSTMENT', 'Inventory Adjustment'
    TRANSFER = 'TRANSFER', 'Transfer Between Locations'
    USAGE = 'USAGE', 'Usage (Addition to Wine)'
    WASTE = 'WASTE', 'Waste/Disposal'
    RETURN = 'RETURN', 'Return to Supplier'


class MaterialMovement(models.Model):
    """
    Stock movement history (purchases, adjustments, usage)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='movements',
        help_text='Material moved'
    )
    
    # Movement details
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        help_text='Type of movement'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text='Quantity moved (positive for additions, negative for removals)'
    )
    location = models.CharField(
        max_length=20,
        choices=StockLocation.choices,
        help_text='Location affected'
    )
    
    # Optional transfer destination (for TRANSFER type)
    destination_location = models.CharField(
        max_length=20,
        choices=StockLocation.choices,
        null=True,
        blank=True,
        help_text='Destination location (for transfers)'
    )
    
    # Tracking
    movement_date = models.DateTimeField(help_text='When the movement occurred')
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        help_text='PO number, invoice number, etc.'
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Cost per unit (for purchases)'
    )
    notes = models.TextField(blank=True, help_text='Additional notes')
    
    # User tracking
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='material_movements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'inventory_material_movement'
        ordering = ['-movement_date', '-created_at']
        indexes = [
            models.Index(fields=['material', '-movement_date']),
            models.Index(fields=['movement_type']),
        ]
    
    def __str__(self):
        return f"{self.get_movement_type_display()}: {self.quantity} {self.material.unit} of {self.material.name}"


class Addition(models.Model):
    """
    Record of materials added to tanks/barrels during production
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        Winery,
        on_delete=models.CASCADE,
        related_name='additions'
    )
    
    # What was added
    material = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        related_name='additions',
        help_text='Material added'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(0)],
        help_text='Quantity added'
    )
    
    # Where it was added
    tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='additions',
        help_text='Tank (if added to tank)'
    )
    barrel = models.ForeignKey(
        'equipment.Barrel',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='additions',
        help_text='Barrel (if added to barrel)'
    )
    wine_lot = models.ForeignKey(
        'production.WineLot',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='additions',
        help_text='Wine lot (if added to lot)'
    )
    batch = models.ForeignKey(
        'harvest.Batch',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='additions',
        help_text='Batch (if added to batch)'
    )
    
    # When and why
    addition_date = models.DateTimeField(help_text='When the addition was made')
    purpose = models.CharField(
        max_length=200,
        blank=True,
        help_text='Purpose of addition (e.g., SO₂ adjustment, clarification)'
    )
    notes = models.TextField(blank=True, help_text='Additional notes')
    
    # Calculated dosage info
    target_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Volume of wine at time of addition (L)'
    )
    dosage_rate = models.CharField(
        max_length=100,
        blank=True,
        help_text='Calculated dosage rate (e.g., 50 mg/L SO₂)'
    )
    
    # User tracking
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='additions_made'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_addition'
        ordering = ['-addition_date', '-created_at']
        indexes = [
            models.Index(fields=['winery', '-addition_date']),
            models.Index(fields=['material']),
            models.Index(fields=['tank']),
            models.Index(fields=['barrel']),
        ]
    
    def __str__(self):
        target = self.get_target_display()
        return f"{self.quantity} {self.material.unit} {self.material.name} → {target}"
    
    def get_target_display(self):
        """Get a human-readable display of where the addition was made"""
        if self.tank:
            return f"Tank {self.tank.code}"
        elif self.barrel:
            return f"Barrel {self.barrel.code}"
        elif self.wine_lot:
            return f"Lot {self.wine_lot.code}"
        elif self.batch:
            return f"Batch {self.batch.batch_code}"
        return "Unknown target"
    
    def clean(self):
        """Validate that exactly one target is specified"""
        from django.core.exceptions import ValidationError
        targets = [self.tank, self.barrel, self.wine_lot, self.batch]
        if sum(1 for t in targets if t is not None) != 1:
            raise ValidationError('Addition must have exactly one target (tank, barrel, wine lot, or batch)')
