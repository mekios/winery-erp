"""
URL configuration for Harvest API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HarvestSeasonViewSet, BatchViewSet, BatchSourceViewSet

router = DefaultRouter()
router.register(r'seasons', HarvestSeasonViewSet, basename='harvest-season')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'sources', BatchSourceViewSet, basename='batch-source')

urlpatterns = [
    path('', include(router.urls)),
]










