"""
Django Admin configuration for Master Data models.
"""
from django.contrib import admin
from .models import GrapeVariety, Grower, VineyardBlock, VineyardVariety, TankMaterial, WoodType


class VineyardVarietyInline(admin.TabularInline):
    """Inline admin for varieties within a vineyard."""
    model = VineyardVariety
    extra = 1
    autocomplete_fields = ['variety']
    fields = ['variety', 'percentage', 'is_primary', 'notes']


@admin.register(GrapeVariety)
class GrapeVarietyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'color', 'winery', 'is_active', 'created_at']
    list_filter = ['winery', 'color', 'is_active']
    search_fields = ['name', 'code']
    ordering = ['winery', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Grower)
class GrowerAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'phone', 'email', 'winery', 'is_active', 'created_at']
    list_filter = ['winery', 'is_active']
    search_fields = ['name', 'contact_name', 'email']
    ordering = ['winery', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(VineyardBlock)
class VineyardBlockAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'grower', 'region', 'area_acres', 'winery', 'is_active']
    list_filter = ['winery', 'grower', 'region', 'is_active']
    search_fields = ['name', 'code', 'region', 'grower__name']
    ordering = ['winery', 'grower__name', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    autocomplete_fields = ['grower']
    inlines = [VineyardVarietyInline]


@admin.register(VineyardVariety)
class VineyardVarietyAdmin(admin.ModelAdmin):
    list_display = ['vineyard', 'variety', 'percentage', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'variety']
    search_fields = ['vineyard__name', 'variety__name']
    ordering = ['vineyard__name', '-is_primary', 'variety__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    autocomplete_fields = ['vineyard', 'variety']


@admin.register(TankMaterial)
class TankMaterialAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['sort_order', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(WoodType)
class WoodTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'origin_country', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'origin_country']
    search_fields = ['name', 'code', 'origin_country']
    ordering = ['sort_order', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']







