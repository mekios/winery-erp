"""
API views for Equipment models.
"""
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q

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
        """Get tank summary statistics using efficient aggregations."""
        queryset = self.get_queryset().filter(is_active=True)
        
        # Single aggregation query for totals
        totals = queryset.aggregate(
            total_tanks=Count('id'),
            total_capacity=Sum('capacity_l'),
            total_volume=Sum('current_volume_l'),
        )
        
        total_tanks = totals['total_tanks'] or 0
        total_capacity = float(totals['total_capacity'] or 0)
        total_volume = float(totals['total_volume'] or 0)
        
        # Efficient count by status using conditional aggregation
        by_status = {
            row['status']: row['count']
            for row in queryset.values('status').annotate(count=Count('id'))
            if row['count'] > 0
        }
        
        # Efficient count by type using conditional aggregation
        by_type = {
            row['tank_type']: row['count']
            for row in queryset.values('tank_type').annotate(count=Count('id'))
            if row['count'] > 0
        }
        
        return Response({
            'total_tanks': total_tanks,
            'total_capacity_l': total_capacity,
            'total_volume_l': total_volume,
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
        """Get barrel summary statistics using efficient aggregations."""
        queryset = self.get_queryset().filter(is_active=True)
        
        # Single aggregation query for totals
        totals = queryset.aggregate(
            total_barrels=Count('id'),
            total_capacity=Sum('volume_l'),
            total_volume=Sum('current_volume_l'),
        )
        
        total_barrels = totals['total_barrels'] or 0
        total_capacity = float(totals['total_capacity'] or 0)
        total_volume = float(totals['total_volume'] or 0)
        
        # Efficient count by wood type
        by_wood_type = {
            row['wood_type']: row['count']
            for row in queryset.values('wood_type').annotate(count=Count('id'))
            if row['count'] > 0
        }
        
        # Efficient count by status
        by_status = {
            row['status']: row['count']
            for row in queryset.values('status').annotate(count=Count('id'))
            if row['count'] > 0
        }
        
        return Response({
            'total_barrels': total_barrels,
            'total_capacity_l': total_capacity,
            'total_volume_l': total_volume,
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

