"""
API views for Winery and WineryMembership management.
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Winery, WineryMembership
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



