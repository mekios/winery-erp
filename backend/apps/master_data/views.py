"""
API views for Master Data models.
Uses ModelViewSets with filtering support.
"""
from rest_framework import viewsets, filters, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend

from apps.wineries.mixins import WineryRequiredMixin
from .models import GrapeVariety, Grower, VineyardBlock, TankMaterial, WoodType
from .serializers import (
    GrapeVarietySerializer, GrapeVarietyListSerializer,
    GrowerSerializer, GrowerListSerializer,
    VineyardBlockSerializer, VineyardBlockListSerializer,
    TankMaterialSerializer, TankMaterialListSerializer,
    WoodTypeSerializer, WoodTypeListSerializer,
)


class GrapeVarietyViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing grape varieties.
    
    list: GET /api/v1/master-data/varieties/
    create: POST /api/v1/master-data/varieties/
    retrieve: GET /api/v1/master-data/varieties/{id}/
    update: PUT /api/v1/master-data/varieties/{id}/
    partial_update: PATCH /api/v1/master-data/varieties/{id}/
    destroy: DELETE /api/v1/master-data/varieties/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = GrapeVarietySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['color', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter by current winery from middleware."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return GrapeVariety.objects.filter(winery=winery)
        return GrapeVariety.objects.none()
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list' and self.request.query_params.get('compact'):
            return GrapeVarietyListSerializer
        return GrapeVarietySerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active varieties."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = GrapeVarietyListSerializer(queryset, many=True)
        return Response(serializer.data)


class GrowerViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing growers.
    
    list: GET /api/v1/master-data/growers/
    create: POST /api/v1/master-data/growers/
    retrieve: GET /api/v1/master-data/growers/{id}/
    update: PUT /api/v1/master-data/growers/{id}/
    partial_update: PATCH /api/v1/master-data/growers/{id}/
    destroy: DELETE /api/v1/master-data/growers/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = GrowerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_name', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter by current winery and annotate with vineyard count."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return Grower.objects.filter(winery=winery).annotate(
                vineyard_count=Count('vineyard_blocks')
            )
        return Grower.objects.none()
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list' and self.request.query_params.get('compact'):
            return GrowerListSerializer
        return GrowerSerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active growers."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = GrowerListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def vineyards(self, request, pk=None):
        """Get all vineyard blocks for this grower."""
        grower = self.get_object()
        vineyards = grower.vineyard_blocks.filter(is_active=True)
        serializer = VineyardBlockListSerializer(vineyards, many=True)
        return Response(serializer.data)


class VineyardBlockViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing vineyard blocks.
    
    list: GET /api/v1/master-data/vineyards/
    create: POST /api/v1/master-data/vineyards/
    retrieve: GET /api/v1/master-data/vineyards/{id}/
    update: PUT /api/v1/master-data/vineyards/{id}/
    partial_update: PATCH /api/v1/master-data/vineyards/{id}/
    destroy: DELETE /api/v1/master-data/vineyards/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VineyardBlockSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['grower', 'region', 'is_active']
    search_fields = ['name', 'code', 'region', 'subregion', 'grower__name']
    ordering_fields = ['name', 'grower__name', 'region', 'created_at']
    ordering = ['grower__name', 'name']
    
    def get_queryset(self):
        """Filter by current winery with related data."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return VineyardBlock.objects.filter(winery=winery).select_related(
                'grower'
            ).prefetch_related('variety_plantings__variety')
        return VineyardBlock.objects.none()
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list' and self.request.query_params.get('compact'):
            return VineyardBlockListSerializer
        return VineyardBlockSerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active blocks."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = VineyardBlockListSerializer(queryset, many=True)
        return Response(serializer.data)


class IsSuperuserOrReadOnly(permissions.BasePermission):
    """
    Allow read access to any authenticated user.
    Write access only for superusers.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_superuser


class TankMaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing tank materials.
    Global list shared across all wineries.
    Superuser-only for write operations, read access for all authenticated users.
    
    list: GET /api/v1/master-data/tank-materials/
    create: POST /api/v1/master-data/tank-materials/  (superuser only)
    retrieve: GET /api/v1/master-data/tank-materials/{id}/
    update: PUT /api/v1/master-data/tank-materials/{id}/  (superuser only)
    partial_update: PATCH /api/v1/master-data/tank-materials/{id}/  (superuser only)
    destroy: DELETE /api/v1/master-data/tank-materials/{id}/  (superuser only)
    """
    permission_classes = [IsSuperuserOrReadOnly]
    serializer_class = TankMaterialSerializer
    queryset = TankMaterial.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list' and self.request.query_params.get('compact'):
            return TankMaterialListSerializer
        return TankMaterialSerializer
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active materials."""
        queryset = TankMaterial.objects.filter(is_active=True)
        serializer = TankMaterialListSerializer(queryset, many=True)
        return Response(serializer.data)


class WoodTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing barrel wood types.
    Global list shared across all wineries.
    Superuser-only for write operations, read access for all authenticated users.
    
    list: GET /api/v1/master-data/wood-types/
    create: POST /api/v1/master-data/wood-types/  (superuser only)
    retrieve: GET /api/v1/master-data/wood-types/{id}/
    update: PUT /api/v1/master-data/wood-types/{id}/  (superuser only)
    partial_update: PATCH /api/v1/master-data/wood-types/{id}/  (superuser only)
    destroy: DELETE /api/v1/master-data/wood-types/{id}/  (superuser only)
    """
    permission_classes = [IsSuperuserOrReadOnly]
    serializer_class = WoodTypeSerializer
    queryset = WoodType.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'origin_country']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list' and self.request.query_params.get('compact'):
            return WoodTypeListSerializer
        return WoodTypeSerializer
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active wood types."""
        queryset = WoodType.objects.filter(is_active=True)
        serializer = WoodTypeListSerializer(queryset, many=True)
        return Response(serializer.data)

