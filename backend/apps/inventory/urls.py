from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'materials', views.MaterialViewSet, basename='material')
router.register(r'stock', views.MaterialStockViewSet, basename='materialstock')
router.register(r'movements', views.MaterialMovementViewSet, basename='materialmovement')
router.register(r'additions', views.AdditionViewSet, basename='addition')

urlpatterns = [
    path('', include(router.urls)),
]

