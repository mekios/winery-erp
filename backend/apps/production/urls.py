from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransferViewSet, WineLotViewSet

router = DefaultRouter()
router.register(r'transfers', TransferViewSet, basename='transfer')
router.register(r'wine-lots', WineLotViewSet, basename='wine-lot')

urlpatterns = [
    path('', include(router.urls)),
]








