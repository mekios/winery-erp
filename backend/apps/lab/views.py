from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from django.db.models import Avg, Min, Max, Count

from apps.wineries.mixins import WineryContextMixin
from apps.wineries.permissions import IsWineryMember
from .models import Analysis
from .serializers import (
    AnalysisSerializer,
    AnalysisCreateSerializer,
    AnalysisListSerializer,
    AnalysisQuickEntrySerializer,
    AnalysisHistorySerializer,
)


class AnalysisFilter(filters.FilterSet):
    """Filter for analyses."""
    
    start_date = filters.DateFilter(field_name='analysis_date', lookup_expr='gte')
    end_date = filters.DateFilter(field_name='analysis_date', lookup_expr='lte')
    
    class Meta:
        model = Analysis
        fields = {
            'sample_type': ['exact'],
            'tank': ['exact'],
            'barrel': ['exact'],
            'wine_lot': ['exact'],
            'batch': ['exact'],
            'analyzed_by': ['exact'],
        }


class AnalysisViewSet(WineryContextMixin, viewsets.ModelViewSet):
    """
    API endpoint for lab analyses.
    
    Supports filtering by:
    - sample_type: TANK, BARREL, WINE_LOT, BATCH, BLEND, BOTTLE, OTHER
    - tank: UUID of tank
    - barrel: UUID of barrel
    - wine_lot: UUID of wine lot
    - batch: UUID of batch
    - analyzed_by: UUID of user
    - start_date, end_date: Date range filters
    """
    
    permission_classes = [IsAuthenticated, IsWineryMember]
    filterset_class = AnalysisFilter
    search_fields = ['notes']
    ordering_fields = ['analysis_date', 'created_at']
    ordering = ['-analysis_date']
    
    def get_queryset(self):
        if not hasattr(self.request, 'winery') or not self.request.winery:
            return Analysis.objects.none()
        
        return Analysis.objects.filter(
            winery=self.request.winery
        ).select_related(
            'tank', 'barrel', 'wine_lot', 'batch', 'analyzed_by'
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AnalysisListSerializer
        elif self.action == 'create':
            return AnalysisCreateSerializer
        elif self.action == 'quick_entry':
            return AnalysisQuickEntrySerializer
        return AnalysisSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            winery=self.request.winery,
            analyzed_by=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def sample_types(self, request):
        """Return available sample types."""
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in Analysis.SampleType.choices
        ])
    
    @action(detail=False, methods=['post'])
    def quick_entry(self, request):
        """
        Quick entry endpoint for rapid analysis data entry.
        Uses a simplified serializer with only common parameters.
        """
        serializer = AnalysisQuickEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            winery=self.request.winery,
            analyzed_by=self.request.user
        )
        return Response(
            AnalysisSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def tank_history(self, request):
        """
        Get analysis history for a specific tank.
        
        Query params:
        - tank: UUID of tank (required)
        - limit: Number of records (default 50)
        """
        tank_id = request.query_params.get('tank')
        if not tank_id:
            return Response(
                {'error': 'tank parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 50))
        
        analyses = self.get_queryset().filter(
            tank_id=tank_id
        ).order_by('analysis_date')[:limit]
        
        # Add computed fields
        data = []
        for a in analyses:
            data.append({
                'date': a.analysis_date,
                'ph': a.ph,
                'ta_gl': a.ta_gl,
                'va_gl': a.va_gl,
                'brix': a.brix,
                'density': a.density,
                'free_so2_mgl': a.free_so2_mgl,
                'total_so2_mgl': a.total_so2_mgl,
                'molecular_so2': a.molecular_so2,
                'alcohol_abv': a.alcohol_abv,
                'malic_acid_gl': a.malic_acid_gl,
                'lactic_acid_gl': a.lactic_acid_gl,
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def wine_lot_history(self, request):
        """
        Get analysis history for a specific wine lot.
        
        Query params:
        - wine_lot: UUID of wine lot (required)
        - limit: Number of records (default 50)
        """
        lot_id = request.query_params.get('wine_lot')
        if not lot_id:
            return Response(
                {'error': 'wine_lot parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 50))
        
        analyses = self.get_queryset().filter(
            wine_lot_id=lot_id
        ).order_by('analysis_date')[:limit]
        
        data = []
        for a in analyses:
            data.append({
                'date': a.analysis_date,
                'ph': a.ph,
                'ta_gl': a.ta_gl,
                'va_gl': a.va_gl,
                'brix': a.brix,
                'density': a.density,
                'free_so2_mgl': a.free_so2_mgl,
                'total_so2_mgl': a.total_so2_mgl,
                'molecular_so2': a.molecular_so2,
                'alcohol_abv': a.alcohol_abv,
                'malic_acid_gl': a.malic_acid_gl,
                'lactic_acid_gl': a.lactic_acid_gl,
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for analyses.
        
        Returns counts and averages for key parameters.
        """
        qs = self.get_queryset()
        
        # Apply date filters if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            qs = qs.filter(analysis_date__gte=start_date)
        if end_date:
            qs = qs.filter(analysis_date__lte=end_date)
        
        stats = qs.aggregate(
            total_count=Count('id'),
            avg_ph=Avg('ph'),
            avg_ta=Avg('ta_gl'),
            avg_va=Avg('va_gl'),
            avg_free_so2=Avg('free_so2_mgl'),
            avg_total_so2=Avg('total_so2_mgl'),
            min_ph=Min('ph'),
            max_ph=Max('ph'),
            min_va=Min('va_gl'),
            max_va=Max('va_gl'),
        )
        
        # Count by sample type
        by_type = qs.values('sample_type').annotate(count=Count('id'))
        type_counts = {item['sample_type']: item['count'] for item in by_type}
        
        return Response({
            'total_count': stats['total_count'],
            'averages': {
                'ph': round(float(stats['avg_ph']), 2) if stats['avg_ph'] else None,
                'ta_gl': round(float(stats['avg_ta']), 2) if stats['avg_ta'] else None,
                'va_gl': round(float(stats['avg_va']), 2) if stats['avg_va'] else None,
                'free_so2_mgl': round(float(stats['avg_free_so2']), 1) if stats['avg_free_so2'] else None,
                'total_so2_mgl': round(float(stats['avg_total_so2']), 1) if stats['avg_total_so2'] else None,
            },
            'ranges': {
                'ph': {
                    'min': float(stats['min_ph']) if stats['min_ph'] else None,
                    'max': float(stats['max_ph']) if stats['max_ph'] else None,
                },
                'va_gl': {
                    'min': float(stats['min_va']) if stats['min_va'] else None,
                    'max': float(stats['max_va']) if stats['max_va'] else None,
                },
            },
            'by_sample_type': type_counts,
        })




