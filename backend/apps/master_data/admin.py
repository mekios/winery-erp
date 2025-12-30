"""
Django Admin configuration for Master Data models.
"""
from django.contrib import admin
from .models import GrapeVariety, Grower, VineyardBlock, TankMaterial, WoodType


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
    list_display = ['name', 'code', 'grower', 'region', 'primary_variety', 'area_ha', 'winery', 'is_active']
    list_filter = ['winery', 'grower', 'region', 'primary_variety', 'is_active']
    search_fields = ['name', 'code', 'region', 'grower__name']
    ordering = ['winery', 'grower__name', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    autocomplete_fields = ['grower', 'primary_variety']


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







