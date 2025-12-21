from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalysisViewSet

router = DefaultRouter()
router.register('analyses', AnalysisViewSet, basename='analysis')

urlpatterns = [
    path('', include(router.urls)),
]




