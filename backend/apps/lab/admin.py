from django.contrib import admin
from .models import Analysis


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'winery', 'sample_type', 'get_source_display',
        'analysis_date', 'ph', 'ta_gl', 'va_gl',
        'brix', 'free_so2_mgl', 'total_so2_mgl',
        'analyzed_by',
    ]
    list_filter = ['sample_type', 'winery', 'analysis_date', 'analyzed_by']
    search_fields = ['notes', 'tank__code', 'barrel__code', 'wine_lot__lot_code', 'batch__batch_code']
    date_hierarchy = 'analysis_date'
    
    readonly_fields = ['id', 'created_at', 'updated_at', 'molecular_so2_display', 'potential_alcohol_display']
    
    fieldsets = [
        ('Sample Source', {
            'fields': ['winery', 'sample_type', 'tank', 'barrel', 'wine_lot', 'batch']
        }),
        ('Timing', {
            'fields': ['analysis_date', 'sample_date', 'temperature_c']
        }),
        ('Basic Parameters', {
            'fields': ['ph', 'ta_gl', 'va_gl']
        }),
        ('Sugar & Density', {
            'fields': ['brix', 'density', 'residual_sugar_gl']
        }),
        ('Sulfur Dioxide', {
            'fields': ['free_so2_mgl', 'total_so2_mgl', 'molecular_so2_display']
        }),
        ('Alcohol', {
            'fields': ['alcohol_abv', 'potential_alcohol_display']
        }),
        ('Organic Acids', {
            'fields': ['malic_acid_gl', 'lactic_acid_gl', 'tartaric_acid_gl', 'citric_acid_gl'],
            'classes': ['collapse']
        }),
        ('Color', {
            'fields': ['color_intensity', 'color_hue'],
            'classes': ['collapse']
        }),
        ('Metadata', {
            'fields': ['analyzed_by', 'notes', 'id', 'created_at', 'updated_at']
        }),
    ]
    
    def molecular_so2_display(self, obj):
        value = obj.molecular_so2
        if value is not None:
            return f"{value} mg/L"
        return "-"
    molecular_so2_display.short_description = "Molecular SO₂ (computed)"
    
    def potential_alcohol_display(self, obj):
        value = obj.potential_alcohol
        if value is not None:
            return f"{value}%"
        return "-"
    potential_alcohol_display.short_description = "Potential Alcohol (from Brix)"

