"""
URL configuration for Master Data API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GrapeVarietyViewSet, GrowerViewSet, VineyardBlockViewSet,
    TankMaterialViewSet, WoodTypeViewSet,
)

router = DefaultRouter()
router.register(r'varieties', GrapeVarietyViewSet, basename='grape-variety')
router.register(r'growers', GrowerViewSet, basename='grower')
router.register(r'vineyards', VineyardBlockViewSet, basename='vineyard-block')
router.register(r'tank-materials', TankMaterialViewSet, basename='tank-material')
router.register(r'wood-types', WoodTypeViewSet, basename='wood-type')

urlpatterns = [
    path('', include(router.urls)),
]







