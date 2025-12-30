from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TankCompositionViewSet, LedgerStatsViewSet

router = DefaultRouter()
router.register(r'composition', TankCompositionViewSet, basename='composition')
router.register(r'stats', LedgerStatsViewSet, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
]





