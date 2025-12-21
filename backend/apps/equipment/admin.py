"""
Django Admin configuration for Equipment models.
"""
from django.contrib import admin
from .models import Tank, Barrel, Equipment


@admin.register(Tank)
class TankAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'name', 'tank_type', 'material', 'capacity_l',
        'current_volume_l', 'status', 'winery', 'is_active'
    ]
    list_filter = ['winery', 'tank_type', 'material', 'status', 'is_active']
    search_fields = ['code', 'name', 'location']
    ordering = ['winery', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('winery', 'code', 'name', 'is_active')
        }),
        ('Specifications', {
            'fields': ('tank_type', 'material', 'capacity_l', 'current_volume_l')
        }),
        ('Features', {
            'fields': ('has_cooling', 'has_heating')
        }),
        ('Location & Status', {
            'fields': ('location', 'status')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Barrel)
class BarrelAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'wood_type', 'toast_level', 'volume_l',
        'vintage_year', 'use_count', 'status', 'winery', 'is_active'
    ]
    list_filter = ['winery', 'wood_type', 'toast_level', 'status', 'is_active']
    search_fields = ['code', 'cooper', 'location']
    ordering = ['winery', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'code', 'equipment_type', 'manufacturer',
        'model', 'status', 'winery', 'is_active'
    ]
    list_filter = ['winery', 'equipment_type', 'status', 'is_active']
    search_fields = ['name', 'code', 'manufacturer', 'model', 'serial_number']
    ordering = ['winery', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']






