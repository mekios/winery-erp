"""
API views for Equipment models.
"""
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.wineries.mixins import WineryRequiredMixin
from .models import Tank, Barrel, Equipment
from .serializers import (
    TankSerializer, TankListSerializer, TankDropdownSerializer,
    BarrelSerializer, BarrelListSerializer, BarrelDropdownSerializer,
    EquipmentSerializer, EquipmentListSerializer,
)


class TankViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing tanks.
    
    list: GET /api/v1/equipment/tanks/
    create: POST /api/v1/equipment/tanks/
    retrieve: GET /api/v1/equipment/tanks/{id}/
    update: PUT /api/v1/equipment/tanks/{id}/
    partial_update: PATCH /api/v1/equipment/tanks/{id}/
    destroy: DELETE /api/v1/equipment/tanks/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TankSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tank_type', 'material', 'status', 'is_active', 'location']
    search_fields = ['code', 'name', 'location']
    ordering_fields = ['code', 'name', 'capacity_l', 'current_volume_l', 'status']
    ordering = ['code']
    
    def get_queryset(self):
        """Filter by current winery."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return Tank.objects.filter(winery=winery)
        return Tank.objects.none()
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'list':
            return TankListSerializer
        return TankSerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active tanks."""
        queryset = self.get_queryset().filter(is_active=True)
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        serializer = TankDropdownSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get tank summary statistics."""
        queryset = self.get_queryset().filter(is_active=True)
        
        total_tanks = queryset.count()
        total_capacity = sum(t.capacity_l for t in queryset)
        total_volume = sum(t.current_volume_l for t in queryset)
        
        by_status = {}
        for status_choice in Tank.STATUS_CHOICES:
            count = queryset.filter(status=status_choice[0]).count()
            if count > 0:
                by_status[status_choice[0]] = count
        
        by_type = {}
        for type_choice in Tank.TANK_TYPE_CHOICES:
            count = queryset.filter(tank_type=type_choice[0]).count()
            if count > 0:
                by_type[type_choice[0]] = count
        
        return Response({
            'total_tanks': total_tanks,
            'total_capacity_l': float(total_capacity),
            'total_volume_l': float(total_volume),
            'utilization_percentage': round((total_volume / total_capacity * 100), 1) if total_capacity > 0 else 0,
            'by_status': by_status,
            'by_type': by_type,
        })


class BarrelViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing barrels.
    
    list: GET /api/v1/equipment/barrels/
    create: POST /api/v1/equipment/barrels/
    retrieve: GET /api/v1/equipment/barrels/{id}/
    update: PUT /api/v1/equipment/barrels/{id}/
    partial_update: PATCH /api/v1/equipment/barrels/{id}/
    destroy: DELETE /api/v1/equipment/barrels/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BarrelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['wood_type', 'toast_level', 'status', 'is_active', 'vintage_year']
    search_fields = ['code', 'cooper', 'location']
    ordering_fields = ['code', 'wood_type', 'vintage_year', 'use_count']
    ordering = ['code']
    
    def get_queryset(self):
        """Filter by current winery."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return Barrel.objects.filter(winery=winery)
        return Barrel.objects.none()
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'list':
            return BarrelListSerializer
        return BarrelSerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact list for dropdowns - only active barrels."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = BarrelDropdownSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get barrel summary statistics."""
        queryset = self.get_queryset().filter(is_active=True)
        
        total_barrels = queryset.count()
        total_capacity = sum(b.volume_l for b in queryset)
        
        by_wood_type = {}
        for wood_choice in Barrel.WOOD_TYPE_CHOICES:
            count = queryset.filter(wood_type=wood_choice[0]).count()
            if count > 0:
                by_wood_type[wood_choice[0]] = count
        
        by_status = {}
        for status_choice in Barrel.STATUS_CHOICES:
            count = queryset.filter(status=status_choice[0]).count()
            if count > 0:
                by_status[status_choice[0]] = count
        
        return Response({
            'total_barrels': total_barrels,
            'total_capacity_l': float(total_capacity),
            'by_wood_type': by_wood_type,
            'by_status': by_status,
        })


class EquipmentViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing equipment.
    
    list: GET /api/v1/equipment/equipment/
    create: POST /api/v1/equipment/equipment/
    retrieve: GET /api/v1/equipment/equipment/{id}/
    update: PUT /api/v1/equipment/equipment/{id}/
    partial_update: PATCH /api/v1/equipment/equipment/{id}/
    destroy: DELETE /api/v1/equipment/equipment/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['equipment_type', 'status', 'is_active']
    search_fields = ['name', 'code', 'manufacturer', 'model', 'serial_number']
    ordering_fields = ['name', 'code', 'equipment_type', 'status']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter by current winery."""
        winery = getattr(self.request, 'winery', None)
        if winery:
            return Equipment.objects.filter(winery=winery)
        return Equipment.objects.none()
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'list':
            return EquipmentListSerializer
        return EquipmentSerializer
    
    def perform_create(self, serializer):
        """Auto-assign winery from request."""
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def maintenance_due(self, request):
        """Get equipment with upcoming or overdue maintenance."""
        from datetime import date, timedelta
        
        queryset = self.get_queryset().filter(is_active=True)
        today = date.today()
        next_week = today + timedelta(days=7)
        
        # Overdue
        overdue = queryset.filter(
            next_maintenance__lt=today
        )
        
        # Due this week
        due_soon = queryset.filter(
            next_maintenance__gte=today,
            next_maintenance__lte=next_week
        )
        
        return Response({
            'overdue': EquipmentListSerializer(overdue, many=True).data,
            'due_soon': EquipmentListSerializer(due_soon, many=True).data,
        })

