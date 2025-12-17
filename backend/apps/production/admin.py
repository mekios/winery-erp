from django.contrib import admin
from .models import Transfer, WineLot, LotBatchLink


class LotBatchLinkInline(admin.TabularInline):
    model = LotBatchLink
    extra = 1
    autocomplete_fields = ['batch']


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'winery', 'action_type', 'transfer_date',
        'source_tank', 'destination_tank', 'volume_l', 'performed_by'
    ]
    list_filter = ['winery', 'action_type', 'transfer_date']
    search_fields = ['notes', 'source_tank__code', 'destination_tank__code']
    autocomplete_fields = [
        'winery', 'source_tank', 'destination_tank',
        'source_barrel', 'destination_barrel',
        'batch', 'wine_lot', 'performed_by'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'transfer_date'
    
    fieldsets = (
        (None, {
            'fields': ('id', 'winery', 'action_type', 'transfer_date')
        }),
        ('Source', {
            'fields': ('source_tank', 'source_barrel')
        }),
        ('Destination', {
            'fields': ('destination_tank', 'destination_barrel')
        }),
        ('Volume & Measurements', {
            'fields': ('volume_l', 'temperature_c')
        }),
        ('Tracking', {
            'fields': ('batch', 'wine_lot')
        }),
        ('Metadata', {
            'fields': ('notes', 'performed_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(WineLot)
class WineLotAdmin(admin.ModelAdmin):
    list_display = [
        'lot_code', 'name', 'winery', 'vintage', 'wine_type',
        'status', 'current_volume_l', 'current_tank'
    ]
    list_filter = ['winery', 'status', 'vintage']
    search_fields = ['lot_code', 'name', 'wine_type', 'notes']
    autocomplete_fields = ['winery', 'current_tank', 'current_barrel']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [LotBatchLinkInline]
    
    fieldsets = (
        (None, {
            'fields': ('id', 'winery', 'lot_code', 'name')
        }),
        ('Wine Details', {
            'fields': ('vintage', 'wine_type', 'status')
        }),
        ('Volume', {
            'fields': ('initial_volume_l', 'current_volume_l')
        }),
        ('Location', {
            'fields': ('current_tank', 'current_barrel')
        }),
        ('Metadata', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
