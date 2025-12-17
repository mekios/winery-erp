from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters

from apps.wineries.mixins import WineryContextMixin
from apps.wineries.permissions import IsWineryMember
from .models import Transfer, WineLot, LotBatchLink
from .serializers import (
    TransferSerializer, TransferCreateSerializer,
    WineLotSerializer, WineLotCreateSerializer,
    LotBatchLinkSerializer,
    TRANSFER_ACTION_CHOICES, WINE_LOT_STATUS_CHOICES,
)


class TransferFilter(filters.FilterSet):
    """Filter for transfers."""
    action_type = filters.CharFilter()
    source_tank = filters.UUIDFilter()
    destination_tank = filters.UUIDFilter()
    source_barrel = filters.UUIDFilter()
    destination_barrel = filters.UUIDFilter()
    batch = filters.UUIDFilter()
    wine_lot = filters.UUIDFilter()
    date_from = filters.DateFilter(field_name='transfer_date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='transfer_date', lookup_expr='lte')
    
    class Meta:
        model = Transfer
        fields = ['action_type', 'source_tank', 'destination_tank', 'batch', 'wine_lot']


class TransferViewSet(WineryContextMixin, viewsets.ModelViewSet):
    """
    API endpoint for wine transfers.
    
    Transfers record volume movement between tanks, barrels, or to external destinations.
    """
    permission_classes = [IsWineryMember]
    filterset_class = TransferFilter
    search_fields = ['notes']
    ordering_fields = ['transfer_date', 'volume_l', 'created_at']
    ordering = ['-transfer_date']
    
    def get_queryset(self):
        if not hasattr(self.request, 'winery') or not self.request.winery:
            return Transfer.objects.none()
        
        return Transfer.objects.filter(winery=self.request.winery).select_related(
            'source_tank', 'destination_tank',
            'source_barrel', 'destination_barrel',
            'batch', 'wine_lot', 'performed_by'
        )
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TransferCreateSerializer
        return TransferSerializer
    
    @action(detail=False, methods=['get'])
    def action_types(self, request):
        """Return available transfer action types."""
        return Response(TRANSFER_ACTION_CHOICES)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return transfer summary statistics."""
        qs = self.get_queryset()
        
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDate
        from datetime import timedelta
        from django.utils import timezone
        
        # Last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_qs = qs.filter(transfer_date__gte=thirty_days_ago)
        
        stats = recent_qs.aggregate(
            total_transfers=Count('id'),
            total_volume=Sum('volume_l'),
        )
        
        # By action type
        by_action = recent_qs.values('action_type').annotate(
            count=Count('id'),
            volume=Sum('volume_l')
        ).order_by('-count')
        
        return Response({
            'period': 'last_30_days',
            'total_transfers': stats['total_transfers'] or 0,
            'total_volume_l': float(stats['total_volume'] or 0),
            'by_action_type': list(by_action),
        })


class WineLotFilter(filters.FilterSet):
    """Filter for wine lots."""
    status = filters.CharFilter()
    vintage = filters.NumberFilter()
    vintage_min = filters.NumberFilter(field_name='vintage', lookup_expr='gte')
    vintage_max = filters.NumberFilter(field_name='vintage', lookup_expr='lte')
    wine_type = filters.CharFilter(lookup_expr='icontains')
    current_tank = filters.UUIDFilter()
    current_barrel = filters.UUIDFilter()
    
    class Meta:
        model = WineLot
        fields = ['status', 'vintage', 'wine_type', 'current_tank', 'current_barrel']


class WineLotViewSet(WineryContextMixin, viewsets.ModelViewSet):
    """
    API endpoint for wine lots.
    
    Wine lots represent finished or in-progress wines that can be linked to
    multiple source batches.
    """
    permission_classes = [IsWineryMember]
    filterset_class = WineLotFilter
    search_fields = ['lot_code', 'name', 'wine_type', 'notes']
    ordering_fields = ['lot_code', 'vintage', 'current_volume_l', 'created_at']
    ordering = ['-vintage', 'lot_code']
    
    def get_queryset(self):
        if not hasattr(self.request, 'winery') or not self.request.winery:
            return WineLot.objects.none()
        
        return WineLot.objects.filter(winery=self.request.winery).select_related(
            'current_tank', 'current_barrel'
        ).prefetch_related('batch_links__batch')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WineLotCreateSerializer
        return WineLotSerializer
    
    @action(detail=False, methods=['get'])
    def statuses(self, request):
        """Return available wine lot statuses."""
        return Response(WINE_LOT_STATUS_CHOICES)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return wine lot summary statistics."""
        qs = self.get_queryset()
        
        from django.db.models import Sum, Count
        
        stats = qs.aggregate(
            total_lots=Count('id'),
            total_volume=Sum('current_volume_l'),
        )
        
        # By status
        by_status = qs.values('status').annotate(
            count=Count('id'),
            volume=Sum('current_volume_l')
        ).order_by('status')
        
        # By vintage
        by_vintage = qs.values('vintage').annotate(
            count=Count('id'),
            volume=Sum('current_volume_l')
        ).order_by('-vintage')[:5]
        
        return Response({
            'total_lots': stats['total_lots'] or 0,
            'total_volume_l': float(stats['total_volume'] or 0),
            'by_status': list(by_status),
            'by_vintage': list(by_vintage),
        })
    
    @action(detail=True, methods=['post'])
    def add_batch(self, request, pk=None):
        """Add a batch link to this wine lot."""
        wine_lot = self.get_object()
        serializer = LotBatchLinkSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(wine_lot=wine_lot)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='remove_batch/(?P<batch_id>[^/.]+)')
    def remove_batch(self, request, pk=None, batch_id=None):
        """Remove a batch link from this wine lot."""
        wine_lot = self.get_object()
        
        try:
            link = wine_lot.batch_links.get(batch_id=batch_id)
            link.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LotBatchLink.DoesNotExist:
            return Response(
                {'error': 'Batch link not found'},
                status=status.HTTP_404_NOT_FOUND
            )
