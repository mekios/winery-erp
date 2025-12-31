from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Count

from apps.wineries.mixins import WineryRequiredMixin
from .models import Material, MaterialStock, MaterialMovement, Addition
from .serializers import (
    MaterialListSerializer, MaterialDetailSerializer, MaterialCreateUpdateSerializer,
    MaterialDropdownSerializer, MaterialStockSerializer,
    MaterialMovementListSerializer, MaterialMovementCreateSerializer,
    AdditionListSerializer, AdditionDetailSerializer, AdditionCreateSerializer
)


class MaterialViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing materials/supplies
    """
    queryset = Material.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'code', 'supplier']
    ordering_fields = ['name', 'category', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MaterialListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MaterialCreateUpdateSerializer
        elif self.action == 'dropdown':
            return MaterialDropdownSerializer
        return MaterialDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.prefetch_related('stock_locations')
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get compact material list for dropdowns"""
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get materials with low stock levels"""
        materials = []
        for material in self.get_queryset().filter(is_active=True, low_stock_threshold__isnull=False):
            if material.is_low_stock():
                materials.append(material)
        
        serializer = MaterialListSerializer(materials, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stock_history(self, request, pk=None):
        """Get stock movement history for a material"""
        material = self.get_object()
        movements = material.movements.all()[:50]  # Last 50 movements
        serializer = MaterialMovementListSerializer(movements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available material categories"""
        from .models import MaterialCategory
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in MaterialCategory.choices
        ])
    
    @action(detail=False, methods=['get'])
    def units(self, request):
        """Get available material units"""
        from .models import MaterialUnit
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in MaterialUnit.choices
        ])


class MaterialStockViewSet(WineryRequiredMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing stock levels (read-only, updated via movements)
    """
    queryset = MaterialStock.objects.all()
    serializer_class = MaterialStockSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['material', 'location']
    ordering = ['material__name', 'location']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('material')
        
        # Filter by material's winery
        queryset = queryset.filter(material__winery=self.request.winery)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def locations(self, request):
        """Get available stock locations"""
        from .models import StockLocation
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in StockLocation.choices
        ])


class MaterialMovementViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing material movements
    """
    queryset = MaterialMovement.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['material', 'movement_type', 'location']
    search_fields = ['reference_number', 'notes']
    ordering_fields = ['movement_date', 'created_at']
    ordering = ['-movement_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MaterialMovementCreateSerializer
        return MaterialMovementListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('material', 'created_by')
        
        # Filter by material's winery
        queryset = queryset.filter(material__winery=self.request.winery)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available movement types"""
        from .models import MovementType
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in MovementType.choices
        ])


class AdditionViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing additions to tanks/barrels
    """
    queryset = Addition.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['material', 'tank', 'barrel', 'wine_lot', 'batch']
    search_fields = ['purpose', 'notes']
    ordering_fields = ['addition_date', 'created_at']
    ordering = ['-addition_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdditionCreateSerializer
        elif self.action == 'retrieve':
            return AdditionDetailSerializer
        return AdditionListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related(
            'material', 'tank', 'barrel', 'wine_lot', 'batch', 'added_by'
        )
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(winery=self.request.winery, added_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_tank(self, request):
        """Get all additions for a specific tank"""
        tank_id = request.query_params.get('tank_id')
        if not tank_id:
            return Response({'error': 'tank_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        additions = self.get_queryset().filter(tank_id=tank_id)
        serializer = self.get_serializer(additions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_barrel(self, request):
        """Get all additions for a specific barrel"""
        barrel_id = request.query_params.get('barrel_id')
        if not barrel_id:
            return Response({'error': 'barrel_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        additions = self.get_queryset().filter(barrel_id=barrel_id)
        serializer = self.get_serializer(additions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get addition summary statistics"""
        queryset = self.get_queryset()
        
        # Total additions
        total_additions = queryset.count()
        
        # Additions this week
        from django.utils import timezone
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        additions_this_week = queryset.filter(addition_date__gte=week_ago).count()
        
        # Most used materials
        most_used = queryset.values('material__name').annotate(
            total_quantity=Sum('quantity'),
            usage_count=Count('id')
        ).order_by('-usage_count')[:5]
        
        return Response({
            'total_additions': total_additions,
            'additions_this_week': additions_this_week,
            'most_used_materials': list(most_used)
        })
