"""
Work Order models for planning and tracking winery tasks.

Work orders enable:
- Planning production tasks ahead of time
- Assigning tasks to specific users
- Tracking task completion
- Auto-creating production events when lines are executed
"""
import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class WorkOrderStatus(models.TextChoices):
    """Status flow for work orders."""
    DRAFT = 'DRAFT', 'Draft'                    # Being created/edited
    PLANNED = 'PLANNED', 'Planned'              # Ready to be worked on
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'  # Work has started
    DONE = 'DONE', 'Done'                       # All lines completed
    VERIFIED = 'VERIFIED', 'Verified'           # Supervisor verified
    CANCELLED = 'CANCELLED', 'Cancelled'        # Work order cancelled


class WorkOrderPriority(models.TextChoices):
    """Priority levels for work orders."""
    LOW = 'LOW', 'Low'
    NORMAL = 'NORMAL', 'Normal'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'


class WorkOrderLineType(models.TextChoices):
    """Types of work order lines."""
    TRANSFER = 'TRANSFER', 'Transfer'           # Move wine between containers
    ADDITION = 'ADDITION', 'Addition'           # Add material to wine
    ANALYSIS = 'ANALYSIS', 'Analysis'           # Take sample and analyze
    INSPECTION = 'INSPECTION', 'Inspection'     # Visual/physical check
    CLEANING = 'CLEANING', 'Cleaning'           # Clean equipment
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'  # Maintain equipment
    OTHER = 'OTHER', 'Other'                    # Custom task


class WorkOrderLineStatus(models.TextChoices):
    """Status for individual work order lines."""
    PENDING = 'PENDING', 'Pending'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    SKIPPED = 'SKIPPED', 'Skipped'


class WorkOrder(models.Model):
    """
    A work order groups related production tasks.
    
    Examples:
    - "Rack Tank A1 to A2" (single transfer)
    - "Weekly Cellar Round" (multiple inspections/analyses)
    - "Blend 2024 Cabernet" (multiple transfers + analyses)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='work_orders'
    )
    
    # Identification
    code = models.CharField(
        max_length=50,
        help_text='Auto-generated or manual work order code'
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        help_text='Brief description (auto-generated from tasks if blank)'
    )
    description = models.TextField(
        blank=True,
        help_text='Detailed instructions or notes'
    )
    
    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=WorkOrderStatus.choices,
        default=WorkOrderStatus.DRAFT
    )
    priority = models.CharField(
        max_length=20,
        choices=WorkOrderPriority.choices,
        default=WorkOrderPriority.NORMAL
    )
    
    # Scheduling
    scheduled_for = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the work should be performed'
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text='Deadline for completion'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the work order was completed'
    )
    
    # Assignment
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_orders_created'
    )
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_orders_assigned',
        help_text='Primary person responsible'
    )
    
    # Verification
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_orders_verified'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_for', '-created_at']
        unique_together = ['winery', 'code']
        indexes = [
            models.Index(fields=['winery', 'status']),
            models.Index(fields=['winery', 'assigned_to', 'status']),
            models.Index(fields=['scheduled_for']),
        ]
    
    def __str__(self):
        return f"{self.code}: {self.title}"
    
    def save(self, *args, **kwargs):
        # Auto-generate code if not provided
        if not self.code:
            self.code = self._generate_code()
        super().save(*args, **kwargs)
    
    def generate_title_from_lines(self):
        """Generate a title based on the work order lines."""
        lines = self.lines.all()
        if not lines.exists():
            return "Empty Work Order"
        
        line_count = lines.count()
        
        if line_count == 1:
            line = lines.first()
            return self._describe_line(line)
        
        # Multiple lines - summarize by type
        type_counts = {}
        for line in lines:
            line_type = line.get_line_type_display()
            type_counts[line_type] = type_counts.get(line_type, 0) + 1
        
        # Build summary like "2 Transfers, 1 Analysis"
        parts = [f"{count} {name}{'s' if count > 1 else ''}" 
                 for name, count in type_counts.items()]
        return ", ".join(parts[:3])  # Limit to 3 types
    
    def _describe_line(self, line):
        """Create a description for a single line."""
        if line.line_type == WorkOrderLineType.TRANSFER:
            from_code = line.from_tank.code if line.from_tank else '?'
            to_code = line.to_tank.code if line.to_tank else '?'
            vol = f" ({int(line.target_volume_l)}L)" if line.target_volume_l else ""
            return f"Transfer {from_code} → {to_code}{vol}"
        
        if line.line_type == WorkOrderLineType.ADDITION:
            tank = line.target_tank.code if line.target_tank else '?'
            material = line.material_name or 'material'
            return f"Add {material} to {tank}"
        
        if line.line_type == WorkOrderLineType.ANALYSIS:
            target = line.target_tank.code if line.target_tank else (
                line.target_barrel.code if line.target_barrel else '?')
            return f"Analyze {target}"
        
        if line.line_type == WorkOrderLineType.INSPECTION:
            target = line.target_tank.code if line.target_tank else (
                line.target_barrel.code if line.target_barrel else '?')
            return f"Inspect {target}"
        
        if line.line_type == WorkOrderLineType.CLEANING:
            target = line.target_tank.code if line.target_tank else (
                line.target_barrel.code if line.target_barrel else '?')
            return f"Clean {target}"
        
        if line.line_type == WorkOrderLineType.MAINTENANCE:
            target = line.target_tank.code if line.target_tank else (
                line.target_barrel.code if line.target_barrel else '?')
            return f"Maintain {target}"
        
        return line.description or line.get_line_type_display()
    
    def update_title_from_lines(self):
        """Update title if it's empty or was auto-generated."""
        if not self.title or self.title.startswith(('Transfer ', 'Add ', 'Analyze ', 
                                                      'Inspect ', 'Clean ', 'Maintain ',
                                                      '1 ', '2 ', '3 ', '4 ', '5 ',
                                                      '6 ', '7 ', '8 ', '9 ')):
            self.title = self.generate_title_from_lines()
            self.save(update_fields=['title'])
    
    def _generate_code(self):
        """Generate a unique work order code."""
        today = timezone.now()
        prefix = f"WO-{today.strftime('%y%m%d')}"
        
        # Find the highest number for today
        existing = WorkOrder.objects.filter(
            winery=self.winery,
            code__startswith=prefix
        ).order_by('-code').first()
        
        if existing:
            try:
                last_num = int(existing.code.split('-')[-1])
                return f"{prefix}-{last_num + 1:03d}"
            except (ValueError, IndexError):
                pass
        
        return f"{prefix}-001"
    
    @property
    def progress_percentage(self):
        """Calculate completion percentage based on lines."""
        total = self.lines.count()
        if total == 0:
            return 0
        completed = self.lines.filter(
            status__in=[WorkOrderLineStatus.COMPLETED, WorkOrderLineStatus.SKIPPED]
        ).count()
        return round((completed / total) * 100)
    
    @property
    def lines_summary(self):
        """Get a summary of line statuses."""
        from django.db.models import Count
        return self.lines.values('status').annotate(count=Count('id'))
    
    def can_start(self):
        """Check if work order can be started."""
        return self.status == WorkOrderStatus.PLANNED and self.lines.exists()
    
    def can_complete(self):
        """Check if work order can be marked as done."""
        if self.status != WorkOrderStatus.IN_PROGRESS:
            return False
        # All lines must be completed or skipped
        pending = self.lines.filter(
            status__in=[WorkOrderLineStatus.PENDING, WorkOrderLineStatus.IN_PROGRESS]
        ).count()
        return pending == 0
    
    def start(self, user=None):
        """Start the work order."""
        if not self.can_start():
            raise ValueError("Cannot start this work order")
        self.status = WorkOrderStatus.IN_PROGRESS
        if user and not self.assigned_to:
            self.assigned_to = user
        self.save()
    
    def complete(self):
        """Mark the work order as done."""
        if not self.can_complete():
            raise ValueError("Cannot complete this work order - pending lines exist")
        self.status = WorkOrderStatus.DONE
        self.completed_at = timezone.now()
        self.save()
    
    def verify(self, user):
        """Verify the work order (supervisor sign-off)."""
        if self.status != WorkOrderStatus.DONE:
            raise ValueError("Can only verify completed work orders")
        self.status = WorkOrderStatus.VERIFIED
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()


class WorkOrderLine(models.Model):
    """
    A single task within a work order.
    
    Different line types have different relevant fields:
    - TRANSFER: from_tank, to_tank, target_volume_l
    - ADDITION: target_tank, material, dosage_value, dosage_unit
    - ANALYSIS: target_tank or target_barrel
    - INSPECTION/CLEANING/MAINTENANCE: target_tank or target_barrel
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    winery = models.ForeignKey(
        'wineries.Winery',
        on_delete=models.CASCADE,
        related_name='work_order_lines'
    )
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    
    # Ordering
    line_no = models.PositiveIntegerField(
        default=1,
        help_text='Order within the work order'
    )
    
    # Type and status
    line_type = models.CharField(
        max_length=20,
        choices=WorkOrderLineType.choices,
        default=WorkOrderLineType.OTHER
    )
    status = models.CharField(
        max_length=20,
        choices=WorkOrderLineStatus.choices,
        default=WorkOrderLineStatus.PENDING
    )
    
    # Target equipment (varies by line type)
    target_tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_lines'
    )
    target_barrel = models.ForeignKey(
        'equipment.Barrel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_lines'
    )
    
    # Transfer-specific fields
    from_tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_lines_from'
    )
    to_tank = models.ForeignKey(
        'equipment.Tank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_lines_to'
    )
    target_volume_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Target volume for transfer'
    )
    
    # Addition-specific fields (material will be added in inventory sprint)
    # material = models.ForeignKey('inventory.Material', ...)
    dosage_value = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text='Dosage amount'
    )
    dosage_unit = models.CharField(
        max_length=20,
        blank=True,
        help_text='e.g., g/L, mL/hL'
    )
    material_name = models.CharField(
        max_length=100,
        blank=True,
        help_text='Material name (until inventory app is ready)'
    )
    
    # Description and notes
    description = models.CharField(
        max_length=500,
        blank=True,
        help_text='What needs to be done'
    )
    notes = models.TextField(
        blank=True,
        help_text='Additional notes or results'
    )
    
    # Link to created event (set when line is executed)
    executed_transfer = models.ForeignKey(
        'production.Transfer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_line'
    )
    executed_analysis = models.ForeignKey(
        'lab.Analysis',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_line'
    )
    
    # Execution tracking
    executed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_lines_executed'
    )
    executed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['work_order', 'line_no']
        indexes = [
            models.Index(fields=['work_order', 'status']),
        ]
    
    def __str__(self):
        return f"{self.work_order.code} Line {self.line_no}: {self.get_line_type_display()}"
    
    def save(self, *args, **kwargs):
        # Auto-set winery from work order
        if not self.winery_id and self.work_order_id:
            self.winery = self.work_order.winery
        
        # Auto-set line_no if not provided
        if not self.line_no:
            max_line = WorkOrderLine.objects.filter(
                work_order=self.work_order
            ).aggregate(models.Max('line_no'))['line_no__max'] or 0
            self.line_no = max_line + 1
        
        super().save(*args, **kwargs)
    
    def complete(self, user, notes=''):
        """Mark the line as completed."""
        self.status = WorkOrderLineStatus.COMPLETED
        self.executed_by = user
        self.executed_at = timezone.now()
        if notes:
            self.notes = notes
        self.save()
        
        # Check if this completes the work order
        if self.work_order.can_complete():
            self.work_order.complete()
    
    def skip(self, user, reason=''):
        """Skip this line."""
        self.status = WorkOrderLineStatus.SKIPPED
        self.executed_by = user
        self.executed_at = timezone.now()
        if reason:
            self.notes = reason
        self.save()
        
        # Check if this completes the work order
        if self.work_order.can_complete():
            self.work_order.complete()
    
    @property
    def target_display(self):
        """Get a display string for the target equipment."""
        if self.line_type == WorkOrderLineType.TRANSFER:
            from_str = self.from_tank.code if self.from_tank else '?'
            to_str = self.to_tank.code if self.to_tank else '?'
            return f"{from_str} → {to_str}"
        if self.target_tank:
            return self.target_tank.code
        if self.target_barrel:
            return self.target_barrel.code
        return ''

