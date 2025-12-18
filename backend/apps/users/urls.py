"""
URL configuration for users app.
"""
from django.urls import path

from .views import ChangePasswordView, CurrentUserView, RegisterView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]





