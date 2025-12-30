"""
Multi-tenant middleware for Winery ERP.
Sets the current winery context on each request.
"""
from .models import WineryMembership


class WineryTenantMiddleware:
    """
    Middleware that sets the current winery on the request.
    
    The winery is determined by:
    1. X-Winery-ID header (preferred for API calls)
    2. Session winery_id (for web sessions)
    
    Must be placed after AuthenticationMiddleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Initialize winery context
        request.winery = None
        request.winery_role = None
        request.winery_membership = None

        # Only process for authenticated users
        if request.user.is_authenticated:
            # Try to get winery_id from header or session
            winery_id = (
                request.headers.get('X-Winery-ID') or
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

        response = self.get_response(request)
        return response










