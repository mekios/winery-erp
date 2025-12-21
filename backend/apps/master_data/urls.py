"""
URL configuration for Master Data API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GrapeVarietyViewSet, GrowerViewSet, VineyardBlockViewSet

router = DefaultRouter()
router.register(r'varieties', GrapeVarietyViewSet, basename='grape-variety')
router.register(r'growers', GrowerViewSet, basename='grower')
router.register(r'vineyards', VineyardBlockViewSet, basename='vineyard-block')

urlpatterns = [
    path('', include(router.urls)),
]






