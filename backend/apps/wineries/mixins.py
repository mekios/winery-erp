"""
Mixins for winery-scoped views.
"""
from rest_framework.exceptions import PermissionDenied
from .models import WineryMembership


class WineryContextMixin:
    """
    Mixin that sets winery context on the request before permission checks.
    
    Use this in ViewSets that need winery-scoped data.
    The winery is determined from:
    1. X-Winery-ID header
    2. Session winery_id (fallback)
    """
    
    def initial(self, request, *args, **kwargs):
        """Called before dispatch - set winery context BEFORE permissions are checked."""
        # First, perform authentication so we have request.user
        self.perform_authentication(request)
        
        # Initialize winery context
        request.winery = None
        request.winery_role = None
        request.winery_membership = None
        
        # Only process for authenticated users
        if request.user.is_authenticated:
            # Try to get winery_id from header or session
            # Note: DRF's request.headers uses the standard header format
            winery_id = (
                request.headers.get('X-Winery-ID') or
                request.META.get('HTTP_X_WINERY_ID') or
                request.session.get('winery_id')
            )
            
            if winery_id:
                # Verify user has access to this winery
                membership = WineryMembership.objects.filter(
                    user=request.user,
                    winery_id=winery_id,
                    is_active=True
                ).select_related('winery').first()
                
                if membership:
                    request.winery = membership.winery
                    request.winery_role = membership.role
                    request.winery_membership = membership
        
        # Now call parent which does permissions and throttles
        # (authentication already done, so it won't repeat)
        super().initial(request, *args, **kwargs)


class WineryRequiredMixin(WineryContextMixin):
    """
    Mixin that requires a valid winery context.
    Raises PermissionDenied if no winery is set.
    """
    
    def initial(self, request, *args, **kwargs):
        """Called before dispatch - enforce winery requirement."""
        super().initial(request, *args, **kwargs)
        
        # Raise error if no winery is set
        if not getattr(request, 'winery', None):
            raise PermissionDenied(
                detail='You must select a winery to access this resource.',
                code='winery_required'
            )



