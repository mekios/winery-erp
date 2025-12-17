"""
Custom permissions for winery access control.
"""
from rest_framework import permissions

from .models import WineryMembership


class IsWineryMember(permissions.BasePermission):
    """
    Permission that checks if user is a member of the current winery.
    Requires WineryTenantMiddleware to set request.winery.
    """
    message = 'You must be a member of this winery.'

    def has_permission(self, request, view):
        return hasattr(request, 'winery') and request.winery is not None


class IsWineryAdmin(permissions.BasePermission):
    """
    Permission that checks if user is an admin (CONSULTANT or WINERY_OWNER).
    """
    message = 'You must be a winery admin to perform this action.'

    def has_permission(self, request, view):
        if not hasattr(request, 'winery') or request.winery is None:
            return False
        return request.winery_role in ['CONSULTANT', 'WINERY_OWNER']


class IsWineryOwnerOrReadOnly(permissions.BasePermission):
    """
    Full access for WINERY_OWNER and CONSULTANT roles.
    Read-only for other roles.
    """
    def has_permission(self, request, view):
        if not hasattr(request, 'winery') or request.winery is None:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.winery_role in ['CONSULTANT', 'WINERY_OWNER']


class IsLabStaffOrHigher(permissions.BasePermission):
    """
    Permission for lab analyses - LAB role and above can edit.
    """
    ALLOWED_ROLES = ['CONSULTANT', 'WINERY_OWNER', 'WINEMAKER', 'LAB']

    def has_permission(self, request, view):
        if not hasattr(request, 'winery') or request.winery is None:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.winery_role in self.ALLOWED_ROLES


class CanExecuteWorkOrders(permissions.BasePermission):
    """
    Permission for work order execution.
    CELLAR_STAFF and above can execute.
    """
    ALLOWED_ROLES = ['CONSULTANT', 'WINERY_OWNER', 'WINEMAKER', 'CELLAR_STAFF']

    def has_permission(self, request, view):
        if not hasattr(request, 'winery') or request.winery is None:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.winery_role in self.ALLOWED_ROLES



