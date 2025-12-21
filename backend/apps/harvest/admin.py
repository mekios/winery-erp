"""
Django Admin configuration for Harvest models.
"""
from django.contrib import admin
from .models import HarvestSeason, Batch, BatchSource


class BatchSourceInline(admin.TabularInline):
    model = BatchSource
    extra = 1
    fields = ['vineyard_block', 'variety', 'weight_kg', 'is_estimated', 'notes']
    autocomplete_fields = ['vineyard_block', 'variety']


@admin.register(HarvestSeason)
class HarvestSeasonAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'winery', 'is_active', 'start_date', 'end_date', 'batch_count']
    list_filter = ['winery', 'year', 'is_active']
    search_fields = ['name']
    ordering = ['-year']
    readonly_fields = ['id', 'created_at', 'updated_at', 'batch_count', 'total_grape_weight_kg']
    
    def batch_count(self, obj):
        return obj.batch_count
    batch_count.short_description = 'Batches'


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = [
        'batch_code', 'harvest_season', 'intake_date', 'source_type',
        'grape_weight_kg', 'stage', 'winery'
    ]
    list_filter = ['winery', 'harvest_season', 'stage', 'source_type']
    search_fields = ['batch_code', 'notes']
    ordering = ['-intake_date', '-created_at']
    readonly_fields = ['id', 'batch_code', 'grape_weight_kg', 'created_at', 'updated_at']
    autocomplete_fields = ['harvest_season', 'initial_tank']
    inlines = [BatchSourceInline]
    
    fieldsets = (
        (None, {
            'fields': ('winery', 'batch_code', 'harvest_season')
        }),
        ('Intake Details', {
            'fields': ('intake_date', 'source_type', 'initial_tank')
        }),
        ('Quantities', {
            'fields': ('grape_weight_kg', 'must_volume_l')
        }),
        ('Status', {
            'fields': ('stage', 'notes')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BatchSource)
class BatchSourceAdmin(admin.ModelAdmin):
    list_display = ['batch', 'vineyard_block', 'variety', 'weight_kg', 'is_estimated', 'winery']
    list_filter = ['winery', 'batch__harvest_season', 'variety', 'is_estimated']
    search_fields = ['batch__batch_code', 'variety__name', 'vineyard_block__name']
    autocomplete_fields = ['batch', 'vineyard_block', 'variety']
    readonly_fields = ['id', 'created_at', 'updated_at']






