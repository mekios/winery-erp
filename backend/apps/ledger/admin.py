from django.contrib import admin
from .models import TankLedger


@admin.register(TankLedger)
class TankLedgerAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tank', 'event_datetime', 'delta_volume_l',
        'composition_key_type', 'composition_key_label', 'derived_source'
    ]
    list_filter = ['winery', 'composition_key_type', 'derived_source']
    search_fields = ['tank__code', 'composition_key_label']
    ordering = ['-event_datetime']
    readonly_fields = [
        'id', 'winery', 'transfer', 'event_datetime', 'tank',
        'delta_volume_l', 'composition_key_type', 'composition_key_id',
        'composition_key_label', 'derived_source', 'created_at', 'updated_at'
    ]
    
    def has_add_permission(self, request):
        # Ledger entries are created by signals, not manually
        return False
    
    def has_change_permission(self, request, obj=None):
        # Ledger entries are immutable
        return False





