from rest_framework import serializers
from django.utils import timezone
from .models import (
    WorkOrder, WorkOrderLine,
    WorkOrderStatus, WorkOrderPriority,
    WorkOrderLineType, WorkOrderLineStatus
)


class WorkOrderLineSerializer(serializers.ModelSerializer):
    """Serializer for work order lines."""
    line_type_display = serializers.CharField(source='get_line_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_display = serializers.CharField(read_only=True)
    
    # Related object displays
    target_tank_code = serializers.CharField(source='target_tank.code', read_only=True)
    target_barrel_code = serializers.CharField(source='target_barrel.code', read_only=True)
    from_tank_code = serializers.CharField(source='from_tank.code', read_only=True)
    to_tank_code = serializers.CharField(source='to_tank.code', read_only=True)
    executed_by_name = serializers.CharField(source='executed_by.full_name', read_only=True)
    
    class Meta:
        model = WorkOrderLine
        fields = [
            'id', 'work_order', 'line_no', 'line_type', 'line_type_display',
            'status', 'status_display', 'target_display',
            'target_tank', 'target_tank_code',
            'target_barrel', 'target_barrel_code',
            'from_tank', 'from_tank_code',
            'to_tank', 'to_tank_code',
            'target_volume_l',
            'material_name', 'dosage_value', 'dosage_unit',
            'description', 'notes',
            'executed_transfer', 'executed_analysis',
            'executed_by', 'executed_by_name', 'executed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'executed_transfer', 'executed_analysis',
            'executed_by', 'executed_at', 'created_at', 'updated_at'
        ]


class WorkOrderLineCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating work order lines."""
    
    class Meta:
        model = WorkOrderLine
        fields = [
            'line_no', 'line_type',
            'target_tank', 'target_barrel',
            'from_tank', 'to_tank', 'target_volume_l',
            'material_name', 'dosage_value', 'dosage_unit',
            'description', 'notes'
        ]


class WorkOrderSerializer(serializers.ModelSerializer):
    """Serializer for work orders (list/retrieve)."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    
    # Related object displays
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.full_name', read_only=True)
    
    # Counts
    lines_count = serializers.SerializerMethodField()
    lines_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkOrder
        fields = [
            'id', 'code', 'title', 'description',
            'status', 'status_display',
            'priority', 'priority_display',
            'scheduled_for', 'due_date', 'completed_at',
            'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name',
            'verified_by', 'verified_by_name', 'verified_at',
            'progress_percentage', 'lines_count', 'lines_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'completed_at',
            'verified_by', 'verified_at',
            'created_at', 'updated_at'
        ]
    
    def get_lines_count(self, obj):
        return obj.lines.count()
    
    def get_lines_completed(self, obj):
        return obj.lines.filter(
            status__in=[WorkOrderLineStatus.COMPLETED, WorkOrderLineStatus.SKIPPED]
        ).count()


class WorkOrderDetailSerializer(WorkOrderSerializer):
    """Detailed serializer including lines."""
    lines = WorkOrderLineSerializer(many=True, read_only=True)
    
    class Meta(WorkOrderSerializer.Meta):
        fields = WorkOrderSerializer.Meta.fields + ['lines']


class WorkOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating work orders."""
    lines = WorkOrderLineCreateSerializer(many=True, required=False)
    
    class Meta:
        model = WorkOrder
        fields = [
            'id', 'code', 'title', 'description',
            'priority', 'scheduled_for', 'due_date',
            'assigned_to', 'lines'
        ]
        read_only_fields = ['id', 'code']
        extra_kwargs = {
            'title': {'required': False, 'allow_blank': True}
        }
    
    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        
        # Set created_by from request user
        validated_data['created_by'] = self.context['request'].user
        validated_data['winery'] = self.context['request'].winery
        
        # Set temporary title if not provided
        if not validated_data.get('title'):
            validated_data['title'] = 'New Work Order'
        
        work_order = WorkOrder.objects.create(**validated_data)
        
        # Create lines
        for i, line_data in enumerate(lines_data, start=1):
            WorkOrderLine.objects.create(
                work_order=work_order,
                winery=work_order.winery,
                line_no=line_data.get('line_no', i),
                **{k: v for k, v in line_data.items() if k != 'line_no'}
            )
        
        # Auto-generate title from lines if not provided
        if not validated_data.get('title') or validated_data.get('title') == 'New Work Order':
            work_order.title = work_order.generate_title_from_lines()
            work_order.save(update_fields=['title'])
        
        return work_order
    
    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        title_was_empty = not validated_data.get('title')
        
        # Update work order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update lines if provided
        if lines_data is not None:
            # Delete existing lines and recreate
            instance.lines.all().delete()
            for i, line_data in enumerate(lines_data, start=1):
                WorkOrderLine.objects.create(
                    work_order=instance,
                    winery=instance.winery,
                    line_no=line_data.get('line_no', i),
                    **{k: v for k, v in line_data.items() if k != 'line_no'}
                )
            
            # Auto-generate title if it was empty
            if title_was_empty:
                instance.title = instance.generate_title_from_lines()
                instance.save(update_fields=['title'])
        
        return instance


class WorkOrderLineCompleteSerializer(serializers.Serializer):
    """Serializer for completing a work order line."""
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Optional: auto-create transfer
    create_transfer = serializers.BooleanField(default=False)
    volume_l = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    temperature_c = serializers.DecimalField(max_digits=4, decimal_places=1, required=False)
    batch_id = serializers.UUIDField(required=False)


class WorkOrderLineSkipSerializer(serializers.Serializer):
    """Serializer for skipping a work order line."""
    reason = serializers.CharField(required=False, allow_blank=True)


class WorkOrderStatusChangeSerializer(serializers.Serializer):
    """Serializer for changing work order status."""
    status = serializers.ChoiceField(choices=WorkOrderStatus.choices)

