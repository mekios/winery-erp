from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, WorkOrderLineViewSet

router = DefaultRouter()
router.register(r'', WorkOrderViewSet, basename='work-orders')

# Separate router for lines (accessed both nested and directly)
lines_router = DefaultRouter()
lines_router.register(r'', WorkOrderLineViewSet, basename='work-order-lines')

urlpatterns = [
    path('', include(router.urls)),
    path('lines/', include(lines_router.urls)),
]





