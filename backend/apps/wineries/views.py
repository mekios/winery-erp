"""
API views for Winery and WineryMembership management.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Winery, WineryMembership
from .mixins import WineryContextMixin
from .permissions import IsWineryAdmin, IsWineryMember
from .serializers import (
    UserWineriesSerializer,
    WineryCreateSerializer,
    WineryMembershipCreateSerializer,
    WineryMembershipSerializer,
    WinerySerializer,
)

User = get_user_model()


class WineryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Winery CRUD operations.
    
    list:   GET /api/v1/wineries/
    create: POST /api/v1/wineries/
    retrieve: GET /api/v1/wineries/{id}/
    update: PUT/PATCH /api/v1/wineries/{id}/
    destroy: DELETE /api/v1/wineries/{id}/
    """
    queryset = Winery.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return WineryCreateSerializer
        return WinerySerializer

    def get_queryset(self):
        """Filter wineries based on user's memberships."""
        user = self.request.user
        if user.is_superuser:
            return Winery.objects.all()
        
        # Get wineries where user has active membership
        winery_ids = WineryMembership.objects.filter(
            user=user,
            is_active=True
        ).values_list('winery_id', flat=True)
        
        return Winery.objects.filter(id__in=winery_ids)

    def perform_create(self, serializer):
        """Create winery and add creator as owner."""
        winery = serializer.save()
        # Automatically add creator as WINERY_OWNER
        WineryMembership.objects.create(
            user=self.request.user,
            winery=winery,
            role='WINERY_OWNER'
        )

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a winery."""
        winery = self.get_object()
        memberships = winery.memberships.filter(is_active=True)
        serializer = WineryMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class UserWineriesView(generics.ListAPIView):
    """
    List all wineries the current user belongs to.
    
    GET /api/v1/wineries/my-wineries/
    """
    serializer_class = UserWineriesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WineryMembership.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('winery')


class WineryMembershipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing winery memberships.
    
    list:   GET /api/v1/wineries/memberships/
    create: POST /api/v1/wineries/memberships/
    retrieve: GET /api/v1/wineries/memberships/{id}/
    update: PUT/PATCH /api/v1/wineries/memberships/{id}/
    destroy: DELETE /api/v1/wineries/memberships/{id}/
    """
    queryset = WineryMembership.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return WineryMembershipCreateSerializer
        return WineryMembershipSerializer

    def get_queryset(self):
        """Filter memberships based on user's admin access."""
        user = self.request.user
        if user.is_superuser:
            return WineryMembership.objects.all()
        
        # Get wineries where user is admin
        admin_winery_ids = WineryMembership.objects.filter(
            user=user,
            is_active=True,
            role__in=['CONSULTANT', 'WINERY_OWNER']
        ).values_list('winery_id', flat=True)
        
        return WineryMembership.objects.filter(winery_id__in=admin_winery_ids)


class SetActiveWineryView(generics.GenericAPIView):
    """
    Set the active winery for the current session.
    
    POST /api/v1/wineries/set-active/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        winery_id = request.data.get('winery_id')
        
        if not winery_id:
            return Response(
                {'error': 'winery_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this winery
        membership = WineryMembership.objects.filter(
            user=request.user,
            winery_id=winery_id,
            is_active=True
        ).first()
        
        if not membership:
            return Response(
                {'error': 'You do not have access to this winery'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Store in session
        request.session['winery_id'] = str(winery_id)
        
        return Response({
            'winery_id': str(winery_id),
            'winery_name': membership.winery.name,
            'role': membership.role
        })


class DashboardView(WineryContextMixin, APIView):
    """
    Dashboard data aggregation endpoint.
    
    GET /api/v1/wineries/dashboard/
    
    Returns:
    - stats: Tank counts, batch counts, transfer counts, analysis counts
    - recent_transfers: Last 5 transfers
    - recent_analyses: Last 5 analyses
    - tanks: Top tanks by fill percentage
    - alerts: Low SO2, high VA alerts
    """
    permission_classes = [permissions.IsAuthenticated, IsWineryMember]

    def get(self, request):
        winery = request.winery
        if not winery:
            return Response(
                {'error': 'No winery selected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # Import models here to avoid circular imports
        from apps.equipment.models import Tank, Barrel
        from apps.harvest.models import Batch, HarvestSeason
        from apps.production.models import Transfer, WineLot
        from apps.lab.models import Analysis

        # === STATS ===
        
        # Tanks
        tanks_qs = Tank.objects.filter(winery=winery)
        tanks_total = tanks_qs.count()
        tanks_active = tanks_qs.filter(status='IN_USE').count()
        tanks_empty = tanks_qs.filter(status='EMPTY').count()
        total_capacity = tanks_qs.aggregate(total=Sum('capacity_l'))['total'] or 0
        total_volume = tanks_qs.aggregate(total=Sum('current_volume_l'))['total'] or 0
        
        # Barrels
        barrels_qs = Barrel.objects.filter(winery=winery)
        barrels_total = barrels_qs.count()
        barrels_in_use = barrels_qs.filter(status='IN_USE').count()
        
        # Batches
        batches_qs = Batch.objects.filter(winery=winery)
        batches_total = batches_qs.count()
        batches_this_season = batches_qs.filter(
            season__is_active=True
        ).count()
        
        # Wine Lots
        lots_qs = WineLot.objects.filter(winery=winery)
        lots_total = lots_qs.count()
        lots_active = lots_qs.filter(status='ACTIVE').count()
        
        # Transfers
        transfers_qs = Transfer.objects.filter(winery=winery)
        transfers_total = transfers_qs.count()
        transfers_today = transfers_qs.filter(
            transfer_date__date=today
        ).count()
        transfers_this_week = transfers_qs.filter(
            transfer_date__date__gte=week_ago
        ).count()
        
        # Analyses
        analyses_qs = Analysis.objects.filter(winery=winery)
        analyses_total = analyses_qs.count()
        analyses_this_week = analyses_qs.filter(
            analysis_date__date__gte=week_ago
        ).count()
        
        # Varieties count
        from apps.master_data.models import GrapeVariety
        varieties_count = GrapeVariety.objects.filter(winery=winery).count()
        
        # Growers count
        from apps.master_data.models import Grower
        growers_count = Grower.objects.filter(winery=winery).count()

        stats = {
            'tanks': {
                'total': tanks_total,
                'active': tanks_active,
                'empty': tanks_empty,
                'total_capacity_l': total_capacity,
                'total_volume_l': total_volume,
                'fill_percentage': round((total_volume / total_capacity * 100), 1) if total_capacity > 0 else 0,
            },
            'barrels': {
                'total': barrels_total,
                'in_use': barrels_in_use,
            },
            'batches': {
                'total': batches_total,
                'this_season': batches_this_season,
            },
            'wine_lots': {
                'total': lots_total,
                'active': lots_active,
            },
            'transfers': {
                'total': transfers_total,
                'today': transfers_today,
                'this_week': transfers_this_week,
            },
            'analyses': {
                'total': analyses_total,
                'this_week': analyses_this_week,
            },
            'varieties': varieties_count,
            'growers': growers_count,
        }

        # === RECENT TRANSFERS ===
        recent_transfers = []
        for t in transfers_qs.order_by('-transfer_date')[:5]:
            recent_transfers.append({
                'id': str(t.id),
                'action_type': t.action_type,
                'action_type_display': t.get_action_type_display(),
                'source_tank': t.source_tank.code if t.source_tank else None,
                'destination_tank': t.destination_tank.code if t.destination_tank else None,
                'volume_l': float(t.volume_l),
                'transfer_date': t.transfer_date.isoformat(),
            })

        # === RECENT ANALYSES ===
        recent_analyses = []
        for a in analyses_qs.order_by('-analysis_date')[:5]:
            recent_analyses.append({
                'id': str(a.id),
                'source_display': a.get_source_display(),
                'analysis_date': a.analysis_date.isoformat(),
                'ph': float(a.ph) if a.ph else None,
                'ta_gl': float(a.ta_gl) if a.ta_gl else None,
                'va_gl': float(a.va_gl) if a.va_gl else None,
                'free_so2_mgl': float(a.free_so2_mgl) if a.free_so2_mgl else None,
            })

        # === TOP TANKS BY FILL ===
        top_tanks = []
        for t in tanks_qs.filter(status='IN_USE').order_by('-current_volume_l')[:6]:
            fill_pct = (t.current_volume_l / t.capacity_l * 100) if t.capacity_l > 0 else 0
            top_tanks.append({
                'id': str(t.id),
                'code': t.code,
                'name': t.name,
                'capacity_l': float(t.capacity_l),
                'current_volume_l': float(t.current_volume_l),
                'fill_percentage': round(fill_pct, 1),
            })

        # === ALERTS ===
        alerts = []
        
        # Low SO2 alerts (free SO2 < 20 mg/L in recent analyses)
        low_so2_analyses = analyses_qs.filter(
            free_so2_mgl__lt=20,
            analysis_date__date__gte=week_ago
        ).order_by('-analysis_date')[:5]
        
        for a in low_so2_analyses:
            alerts.append({
                'type': 'warning',
                'category': 'low_so2',
                'message': f'Low SO₂ in {a.get_source_display()}: {a.free_so2_mgl} mg/L',
                'date': a.analysis_date.isoformat(),
                'source_id': str(a.tank_id or a.barrel_id or a.wine_lot_id or ''),
            })
        
        # High VA alerts (VA > 0.6 g/L)
        high_va_analyses = analyses_qs.filter(
            va_gl__gt=0.6,
            analysis_date__date__gte=week_ago
        ).order_by('-analysis_date')[:5]
        
        for a in high_va_analyses:
            alerts.append({
                'type': 'danger',
                'category': 'high_va',
                'message': f'High VA in {a.get_source_display()}: {a.va_gl} g/L',
                'date': a.analysis_date.isoformat(),
                'source_id': str(a.tank_id or a.barrel_id or a.wine_lot_id or ''),
            })

        return Response({
            'stats': stats,
            'recent_transfers': recent_transfers,
            'recent_analyses': recent_analyses,
            'top_tanks': top_tanks,
            'alerts': alerts,
        })


