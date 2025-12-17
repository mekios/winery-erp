"""
API views for Harvest models.
"""
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count

from apps.wineries.mixins import WineryRequiredMixin
from .models import HarvestSeason, Batch, BatchSource
from .serializers import (
    HarvestSeasonSerializer, HarvestSeasonListSerializer, HarvestSeasonDropdownSerializer,
    BatchSerializer, BatchListSerializer, BatchCreateSerializer, BatchUpdateSerializer,
    BatchSourceSerializer, BatchSourceCreateSerializer,
)


class HarvestSeasonViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing harvest seasons.
    
    list: GET /api/v1/harvest/seasons/
    create: POST /api/v1/harvest/seasons/
    retrieve: GET /api/v1/harvest/seasons/{id}/
    update: PUT /api/v1/harvest/seasons/{id}/
    partial_update: PATCH /api/v1/harvest/seasons/{id}/
    destroy: DELETE /api/v1/harvest/seasons/{id}/
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['year', 'is_active']
    ordering_fields = ['year', 'start_date']
    ordering = ['-year']
    
    def get_queryset(self):
        winery = getattr(self.request, 'winery', None)
        if winery:
            return HarvestSeason.objects.filter(winery=winery).annotate(
                _batch_count=Count('batches')
            )
        return HarvestSeason.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HarvestSeasonListSerializer
        return HarvestSeasonSerializer
    
    def perform_create(self, serializer):
        serializer.save(winery=self.request.winery)
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get active seasons for dropdowns."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = HarvestSeasonDropdownSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current active season."""
        season = self.get_queryset().filter(is_active=True).first()
        if season:
            serializer = HarvestSeasonSerializer(season)
            return Response(serializer.data)
        return Response({'detail': 'No active season found'}, status=404)


class BatchViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing batches.
    
    list: GET /api/v1/harvest/batches/
    create: POST /api/v1/harvest/batches/
    retrieve: GET /api/v1/harvest/batches/{id}/
    update: PUT /api/v1/harvest/batches/{id}/
    partial_update: PATCH /api/v1/harvest/batches/{id}/
    destroy: DELETE /api/v1/harvest/batches/{id}/
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['harvest_season', 'stage', 'source_type', 'initial_tank']
    search_fields = ['batch_code', 'notes']
    ordering_fields = ['batch_code', 'intake_date', 'grape_weight_kg', 'stage']
    ordering = ['-intake_date', '-created_at']
    
    def get_queryset(self):
        winery = getattr(self.request, 'winery', None)
        if winery:
            return Batch.objects.filter(winery=winery).select_related(
                'harvest_season', 'initial_tank'
            ).prefetch_related('sources__variety', 'sources__vineyard_block')
        return Batch.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BatchListSerializer
        if self.action == 'create':
            return BatchCreateSerializer
        if self.action in ['update', 'partial_update']:
            return BatchUpdateSerializer
        return BatchSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get batch summary statistics."""
        queryset = self.get_queryset()
        
        season_id = request.query_params.get('season')
        if season_id:
            queryset = queryset.filter(harvest_season_id=season_id)
        
        totals = queryset.aggregate(
            total_batches=Count('id'),
            total_grape_weight=Sum('grape_weight_kg'),
            total_must_volume=Sum('must_volume_l'),
        )
        
        by_stage = {}
        for stage_choice in Batch.STAGE_CHOICES:
            count = queryset.filter(stage=stage_choice[0]).count()
            if count > 0:
                by_stage[stage_choice[0]] = count
        
        by_source_type = {}
        for source_choice in Batch.SOURCE_TYPE_CHOICES:
            count = queryset.filter(source_type=source_choice[0]).count()
            if count > 0:
                by_source_type[source_choice[0]] = count
        
        return Response({
            'total_batches': totals['total_batches'] or 0,
            'total_grape_weight_kg': float(totals['total_grape_weight'] or 0),
            'total_must_volume_l': float(totals['total_must_volume'] or 0),
            'by_stage': by_stage,
            'by_source_type': by_source_type,
        })
    
    @action(detail=True, methods=['post'])
    def add_source(self, request, pk=None):
        """Add a source to a batch."""
        batch = self.get_object()
        serializer = BatchSourceCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            source = BatchSource.objects.create(
                winery=request.winery,
                batch=batch,
                **serializer.validated_data
            )
            return Response(
                BatchSourceSerializer(source).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BatchSourceViewSet(WineryRequiredMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing batch sources.
    
    list: GET /api/v1/harvest/sources/
    create: POST /api/v1/harvest/sources/
    retrieve: GET /api/v1/harvest/sources/{id}/
    update: PUT /api/v1/harvest/sources/{id}/
    partial_update: PATCH /api/v1/harvest/sources/{id}/
    destroy: DELETE /api/v1/harvest/sources/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BatchSourceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['batch', 'variety', 'vineyard_block']
    
    def get_queryset(self):
        winery = getattr(self.request, 'winery', None)
        if winery:
            return BatchSource.objects.filter(winery=winery).select_related(
                'batch', 'variety', 'vineyard_block', 'vineyard_block__grower'
            )
        return BatchSource.objects.none()
    
    def perform_create(self, serializer):
        batch_id = self.request.data.get('batch')
        batch = Batch.objects.get(id=batch_id, winery=self.request.winery)
        serializer.save(winery=self.request.winery, batch=batch)



