"""
URL configuration for wineries app.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardView,
    SetActiveWineryView,
    UserWineriesView,
    WineryMembershipViewSet,
    WineryViewSet,
)

app_name = 'wineries'

router = DefaultRouter()
router.register('', WineryViewSet, basename='winery')
router.register('memberships', WineryMembershipViewSet, basename='membership')

urlpatterns = [
    path('my-wineries/', UserWineriesView.as_view(), name='my-wineries'),
    path('set-active/', SetActiveWineryView.as_view(), name='set-active'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]



