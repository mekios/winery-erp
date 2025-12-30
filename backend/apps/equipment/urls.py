"""
URL configuration for Equipment API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TankViewSet, BarrelViewSet, EquipmentViewSet

router = DefaultRouter()
router.register(r'tanks', TankViewSet, basename='tank')
router.register(r'barrels', BarrelViewSet, basename='barrel')
router.register(r'equipment', EquipmentViewSet, basename='equipment')

urlpatterns = [
    path('', include(router.urls)),
]










