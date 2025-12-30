"""
API views for the Tank Ledger composition engine.

Provides endpoints for:
- Tank composition (by batch, variety, vineyard)
- Integrity checks
- Ledger history
"""
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from apps.wineries.mixins import WineryContextMixin
from apps.wineries.permissions import IsWineryMember
from apps.equipment.models import Tank
from .models import TankLedger
from .serializers import (
    TankLedgerEntrySerializer,
    TankCompositionSerializer,
    TankIntegritySerializer,
)


class TankCompositionViewSet(WineryContextMixin, viewsets.ViewSet):
    """
    API endpoint for tank composition queries.
    
    GET /api/v1/ledger/composition/{tank_id}/
        Returns full composition breakdown for a tank
    
    GET /api/v1/ledger/composition/
        Returns composition summary for all tanks
    
    GET /api/v1/ledger/composition/integrity/
        Returns integrity issues across all tanks
    """
    permission_classes = [IsAuthenticated, IsWineryMember]
    
    def list(self, request):
        """Get composition summary for all tanks."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        tanks = Tank.objects.filter(
            winery=request.winery,
            is_active=True,
            current_volume_l__gt=0
        )
        
        results = []
        for tank in tanks:
            composition = TankLedger.get_tank_composition(tank)
            results.append({
                'tank_id': str(tank.id),
                'tank_code': tank.code,
                'tank_name': tank.name or '',
                'total_volume_l': composition['total_volume_l'],
                'by_batch': composition['by_batch'],
                'by_variety': composition['by_variety'],
                'by_vineyard': composition['by_vineyard'],
                'unknown_volume_l': composition['unknown_volume_l'],
                'unknown_percentage': composition['unknown_percentage'],
                'has_integrity_issues': composition['has_integrity_issues'],
            })
        
        return Response(results)
    
    def retrieve(self, request, pk=None):
        """Get detailed composition for a specific tank."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        try:
            tank = Tank.objects.get(id=pk, winery=request.winery)
        except Tank.DoesNotExist:
            return Response({'error': 'Tank not found'}, status=404)
        
        composition = TankLedger.get_tank_composition(tank)
        
        result = {
            'tank_id': str(tank.id),
            'tank_code': tank.code,
            'tank_name': tank.name or '',
            'total_volume_l': composition['total_volume_l'],
            'by_batch': composition['by_batch'],
            'by_variety': composition['by_variety'],
            'by_vineyard': composition['by_vineyard'],
            'unknown_volume_l': composition['unknown_volume_l'],
            'unknown_percentage': composition['unknown_percentage'],
            'has_integrity_issues': composition['has_integrity_issues'],
        }
        
        serializer = TankCompositionSerializer(result)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def integrity(self, request):
        """Check integrity across all tanks."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        tanks = Tank.objects.filter(
            winery=request.winery,
            is_active=True
        )
        
        issues = []
        for tank in tanks:
            composition = TankLedger.get_tank_composition(tank)
            
            ledger_volume = composition['total_volume_l']
            tank_volume = tank.current_volume_l
            volume_mismatch = ledger_volume - tank_volume
            
            has_issues = (
                composition['has_integrity_issues'] or
                abs(volume_mismatch) > Decimal('1')  # Allow 1L tolerance
            )
            
            if has_issues:
                issues.append({
                    'tank_id': str(tank.id),
                    'tank_code': tank.code,
                    'has_unknown_volume': composition['unknown_volume_l'] > 0,
                    'unknown_volume_l': composition['unknown_volume_l'],
                    'unknown_percentage': composition['unknown_percentage'],
                    'has_negative_composition': any(
                        b['volume_l'] < 0 for b in composition['by_batch']
                    ),
                    'ledger_volume_l': ledger_volume,
                    'tank_current_volume_l': tank_volume,
                    'volume_mismatch_l': volume_mismatch,
                })
        
        return Response({
            'total_tanks': tanks.count(),
            'tanks_with_issues': len(issues),
            'issues': issues,
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get ledger history for a specific tank."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        try:
            tank = Tank.objects.get(id=pk, winery=request.winery)
        except Tank.DoesNotExist:
            return Response({'error': 'Tank not found'}, status=404)
        
        limit = int(request.query_params.get('limit', 100))
        
        entries = TankLedger.objects.filter(
            tank=tank
        ).select_related('transfer').order_by('-event_datetime')[:limit]
        
        serializer = TankLedgerEntrySerializer(entries, many=True)
        return Response(serializer.data)


class LedgerStatsViewSet(WineryContextMixin, viewsets.ViewSet):
    """
    API endpoint for ledger-wide statistics.
    """
    permission_classes = [IsAuthenticated, IsWineryMember]
    
    def list(self, request):
        """Get overall ledger statistics."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        from django.db.models import Count
        
        entries = TankLedger.objects.filter(winery=request.winery)
        
        stats = entries.aggregate(
            total_entries=Count('id'),
            total_explicit=Count('id', filter=models.Q(derived_source='EXPLICIT')),
            total_inherited=Count('id', filter=models.Q(derived_source='INHERITED')),
            total_unknown=Count('id', filter=models.Q(derived_source='UNKNOWN')),
        )
        
        # Count tanks with ledger data
        tanks_with_data = entries.values('tank').distinct().count()
        
        # Count tanks with unknown composition
        tanks_with_unknown = entries.filter(
            composition_key_type='UNKNOWN'
        ).values('tank').distinct().count()
        
        return Response({
            'total_entries': stats['total_entries'],
            'by_source': {
                'explicit': stats['total_explicit'],
                'inherited': stats['total_inherited'],
                'unknown': stats['total_unknown'],
            },
            'tanks_with_data': tanks_with_data,
            'tanks_with_unknown': tanks_with_unknown,
        })


# Need to import models for the Q object
from django.db import models





