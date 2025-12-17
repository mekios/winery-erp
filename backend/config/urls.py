"""
URL configuration for Winery ERP project.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# API v1 URL patterns
api_v1_patterns = [
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Users
    path('users/', include('apps.users.urls')),
    
    # Wineries
    path('wineries/', include('apps.wineries.urls')),
    
    # Master Data (Phase 1 - Sprint 1.2)
    path('master-data/', include('apps.master_data.urls')),
    
    # Equipment (Phase 1 - Sprint 1.2)
    path('equipment/', include('apps.equipment.urls')),
    
    # Harvest (Phase 1 - Sprint 1.3)
    path('harvest/', include('apps.harvest.urls')),
    
    # Production (Phase 1 - Sprint 1.4)
    path('production/', include('apps.production.urls')),
    
    # Lab (Phase 1 - Sprint 1.5)
    path('lab/', include('apps.lab.urls')),
    
    # Inventory (Phase 2)
    # path('materials/', include('apps.inventory.urls.materials')),
    # path('additions/', include('apps.inventory.urls.additions')),
    
    # Work Orders (Phase 2)
    # path('work-orders/', include('apps.work_orders.urls')),
    
    # Packaging (Phase 3)
    # path('packaging-skus/', include('apps.packaging.urls.skus')),
    # path('bottling-runs/', include('apps.packaging.urls.bottling')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include(api_v1_patterns)),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Debug toolbar (development only)
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

