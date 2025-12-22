"""
API views for Work Orders.

Provides endpoints for:
- Work order CRUD
- Work order line management
- Status transitions (start, complete, verify)
- Line execution (complete, skip)
"""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.wineries.mixins import WineryContextMixin
from apps.wineries.permissions import IsWineryMember
from .models import (
    WorkOrder, WorkOrderLine,
    WorkOrderStatus, WorkOrderLineStatus, WorkOrderLineType
)
from .serializers import (
    WorkOrderSerializer, WorkOrderDetailSerializer, WorkOrderCreateSerializer,
    WorkOrderLineSerializer, WorkOrderLineCreateSerializer,
    WorkOrderLineCompleteSerializer, WorkOrderLineSkipSerializer,
    WorkOrderStatusChangeSerializer
)


class WorkOrderViewSet(WineryContextMixin, viewsets.ModelViewSet):
    """
    ViewSet for Work Orders.
    
    list:    GET /api/v1/work-orders/
    create:  POST /api/v1/work-orders/
    retrieve: GET /api/v1/work-orders/{id}/
    update:  PUT/PATCH /api/v1/work-orders/{id}/
    destroy: DELETE /api/v1/work-orders/{id}/
    
    Custom actions:
    - start:    POST /api/v1/work-orders/{id}/start/
    - complete: POST /api/v1/work-orders/{id}/complete/
    - verify:   POST /api/v1/work-orders/{id}/verify/
    - summary:  GET /api/v1/work-orders/summary/
    """
    permission_classes = [IsAuthenticated, IsWineryMember]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['code', 'title', 'description']
    ordering_fields = ['code', 'scheduled_for', 'due_date', 'priority', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if not hasattr(self.request, 'winery') or not self.request.winery:
            return WorkOrder.objects.none()
        
        return WorkOrder.objects.filter(
            winery=self.request.winery
        ).select_related(
            'assigned_to', 'created_by', 'verified_by'
        ).prefetch_related('lines')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkOrderCreateSerializer
        if self.action in ['update', 'partial_update']:
            return WorkOrderCreateSerializer
        if self.action == 'retrieve':
            return WorkOrderDetailSerializer
        return WorkOrderSerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get work order summary statistics."""
        if not hasattr(request, 'winery') or not request.winery:
            return Response({'error': 'Winery context required'}, status=400)
        
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        # Status counts
        by_status = queryset.values('status').annotate(count=Count('id'))
        status_counts = {item['status']: item['count'] for item in by_status}
        
        # Priority counts
        by_priority = queryset.exclude(
            status__in=[WorkOrderStatus.DONE, WorkOrderStatus.VERIFIED, WorkOrderStatus.CANCELLED]
        ).values('priority').annotate(count=Count('id'))
        priority_counts = {item['priority']: item['count'] for item in by_priority}
        
        # Due today/overdue
        due_today = queryset.filter(
            due_date=today,
            status__in=[WorkOrderStatus.DRAFT, WorkOrderStatus.PLANNED, WorkOrderStatus.IN_PROGRESS]
        ).count()
        
        overdue = queryset.filter(
            due_date__lt=today,
            status__in=[WorkOrderStatus.DRAFT, WorkOrderStatus.PLANNED, WorkOrderStatus.IN_PROGRESS]
        ).count()
        
        # My assignments
        my_assigned = queryset.filter(
            assigned_to=request.user,
            status__in=[WorkOrderStatus.PLANNED, WorkOrderStatus.IN_PROGRESS]
        ).count()
        
        return Response({
            'total': queryset.count(),
            'by_status': status_counts,
            'by_priority': priority_counts,
            'due_today': due_today,
            'overdue': overdue,
            'my_assigned': my_assigned,
        })
    
    @action(detail=True, methods=['post'], url_path='mark-ready')
    def mark_ready(self, request, pk=None):
        """Mark a draft work order as ready/planned."""
        work_order = self.get_object()
        
        if work_order.status != WorkOrderStatus.DRAFT:
            return Response(
                {'error': 'Only draft work orders can be marked as ready'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not work_order.lines.exists():
            return Response(
                {'error': 'Work order must have at least one task'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.status = WorkOrderStatus.PLANNED
        work_order.save()
        return Response(WorkOrderDetailSerializer(work_order).data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a work order."""
        work_order = self.get_object()
        
        try:
            work_order.start(user=request.user)
            return Response(WorkOrderDetailSerializer(work_order).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a work order as done."""
        work_order = self.get_object()
        
        try:
            work_order.complete()
            return Response(WorkOrderDetailSerializer(work_order).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a completed work order."""
        work_order = self.get_object()
        
        try:
            work_order.verify(user=request.user)
            return Response(WorkOrderDetailSerializer(work_order).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a work order."""
        work_order = self.get_object()
        
        if work_order.status in [WorkOrderStatus.DONE, WorkOrderStatus.VERIFIED]:
            return Response(
                {'error': 'Cannot cancel completed work orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.status = WorkOrderStatus.CANCELLED
        work_order.save()
        return Response(WorkOrderDetailSerializer(work_order).data)
    
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a cancelled or done work order."""
        work_order = self.get_object()
        
        if work_order.status not in [WorkOrderStatus.CANCELLED, WorkOrderStatus.DONE]:
            return Response(
                {'error': 'Can only reopen cancelled or done work orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.status = WorkOrderStatus.IN_PROGRESS
        work_order.completed_at = None
        work_order.save()
        return Response(WorkOrderDetailSerializer(work_order).data)


class WorkOrderLineViewSet(WineryContextMixin, viewsets.ModelViewSet):
    """
    ViewSet for Work Order Lines.
    
    Usually accessed through the work order, but also available directly.
    
    list:    GET /api/v1/work-order-lines/
    retrieve: GET /api/v1/work-order-lines/{id}/
    update:  PATCH /api/v1/work-order-lines/{id}/
    
    Custom actions:
    - complete: POST /api/v1/work-order-lines/{id}/complete/
    - skip:     POST /api/v1/work-order-lines/{id}/skip/
    """
    permission_classes = [IsAuthenticated, IsWineryMember]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['work_order', 'status', 'line_type']
    ordering_fields = ['line_no', 'created_at']
    ordering = ['work_order', 'line_no']
    
    def get_queryset(self):
        if not hasattr(self.request, 'winery') or not self.request.winery:
            return WorkOrderLine.objects.none()
        
        return WorkOrderLine.objects.filter(
            winery=self.request.winery
        ).select_related(
            'work_order', 'target_tank', 'target_barrel',
            'from_tank', 'to_tank', 'executed_by'
        )
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return WorkOrderLineCreateSerializer
        return WorkOrderLineSerializer
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a line as completed, optionally creating an event."""
        line = self.get_object()
        serializer = WorkOrderLineCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notes = serializer.validated_data.get('notes', '')
        create_transfer = serializer.validated_data.get('create_transfer', False)
        
        # If this is a transfer line and we should create a transfer
        if create_transfer and line.line_type == WorkOrderLineType.TRANSFER:
            transfer = self._create_transfer_from_line(line, serializer.validated_data, request.user)
            line.executed_transfer = transfer
        
        line.complete(user=request.user, notes=notes)
        
        # Update work order status if needed
        work_order = line.work_order
        if work_order.status == WorkOrderStatus.PLANNED:
            work_order.status = WorkOrderStatus.IN_PROGRESS
            work_order.save()
        
        return Response(WorkOrderLineSerializer(line).data)
    
    @action(detail=True, methods=['post'])
    def skip(self, request, pk=None):
        """Skip a line."""
        line = self.get_object()
        serializer = WorkOrderLineSkipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data.get('reason', '')
        line.skip(user=request.user, reason=reason)
        
        return Response(WorkOrderLineSerializer(line).data)
    
    def _create_transfer_from_line(self, line, data, user):
        """Create a Transfer record from a work order line."""
        from apps.production.models import Transfer, TransferActionType
        from apps.harvest.models import Batch
        
        volume = data.get('volume_l', line.target_volume_l)
        if not volume:
            raise ValueError("Volume is required to create a transfer")
        
        batch = None
        batch_id = data.get('batch_id')
        if batch_id:
            batch = Batch.objects.filter(id=batch_id, winery=line.winery).first()
        
        transfer = Transfer.objects.create(
            winery=line.winery,
            action_type=TransferActionType.RACK,
            source_tank=line.from_tank,
            destination_tank=line.to_tank,
            volume_l=volume,
            temperature_c=data.get('temperature_c'),
            batch=batch,
            performed_by=user,
            notes=f"Created from Work Order {line.work_order.code}, Line {line.line_no}"
        )
        
        return transfer

