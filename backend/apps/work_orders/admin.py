from django.contrib import admin
from .models import WorkOrder, WorkOrderLine


class WorkOrderLineInline(admin.TabularInline):
    model = WorkOrderLine
    extra = 0
    fields = ['line_no', 'line_type', 'description', 'target_tank', 'from_tank', 'to_tank', 'status']
    readonly_fields = ['executed_at', 'executed_by']


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'title', 'winery', 'status', 'priority',
        'scheduled_for', 'assigned_to', 'created_at'
    ]
    list_filter = ['winery', 'status', 'priority']
    search_fields = ['code', 'title', 'description']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at', 'verified_at']
    inlines = [WorkOrderLineInline]
    
    fieldsets = (
        (None, {
            'fields': ('id', 'winery', 'code', 'title', 'description')
        }),
        ('Status', {
            'fields': ('status', 'priority')
        }),
        ('Scheduling', {
            'fields': ('scheduled_for', 'due_date', 'completed_at')
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Verification', {
            'fields': ('verified_by', 'verified_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkOrderLine)
class WorkOrderLineAdmin(admin.ModelAdmin):
    list_display = [
        'work_order', 'line_no', 'line_type', 'status',
        'target_display', 'executed_at'
    ]
    list_filter = ['status', 'line_type']
    search_fields = ['work_order__code', 'description']
    ordering = ['work_order', 'line_no']
    readonly_fields = ['id', 'created_at', 'updated_at', 'executed_at']
    
    def target_display(self, obj):
        return obj.target_display
    target_display.short_description = 'Target'





