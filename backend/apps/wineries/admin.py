"""
Admin configuration for Winery and WineryMembership models.
"""
from django.contrib import admin

from .models import Winery, WineryMembership


class WineryMembershipInline(admin.TabularInline):
    """Inline admin for winery memberships."""
    model = WineryMembership
    extra = 1
    autocomplete_fields = ['user']


@admin.register(Winery)
class WineryAdmin(admin.ModelAdmin):
    """Admin configuration for Winery model."""
    
    list_display = ['name', 'code', 'country', 'region', 'member_count', 'created_at']
    list_filter = ['country', 'region', 'created_at']
    search_fields = ['name', 'code', 'country', 'region']
    ordering = ['name']
    
    inlines = [WineryMembershipInline]
    
    fieldsets = (
        (None, {'fields': ('name', 'code')}),
        ('Location', {'fields': ('country', 'region', 'address')}),
        ('Settings', {'fields': ('timezone',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']

    def member_count(self, obj):
        return obj.memberships.filter(is_active=True).count()
    member_count.short_description = 'Members'


@admin.register(WineryMembership)
class WineryMembershipAdmin(admin.ModelAdmin):
    """Admin configuration for WineryMembership model."""
    
    list_display = ['user', 'winery', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'winery', 'created_at']
    search_fields = ['user__email', 'user__full_name', 'winery__name']
    ordering = ['winery__name', 'user__email']
    autocomplete_fields = ['user', 'winery']
    
    fieldsets = (
        (None, {'fields': ('user', 'winery', 'role')}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']





