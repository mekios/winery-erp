from rest_framework import serializers
from .models import Material, MaterialStock, MaterialMovement, Addition


class MaterialListSerializer(serializers.ModelSerializer):
    """Serializer for material list view"""
    current_stock = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'code', 'category', 'category_display',
            'unit', 'unit_display', 'supplier', 'current_stock',
            'is_low_stock', 'low_stock_threshold', 'is_active',
            'created_at', 'updated_at'
        ]
    
    def get_current_stock(self, obj):
        return float(obj.get_current_stock())
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock()


class MaterialDetailSerializer(serializers.ModelSerializer):
    """Serializer for material detail view"""
    current_stock = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    stock_by_location = serializers.SerializerMethodField()
    
    class Meta:
        model = Material
        fields = [
            'id', 'winery', 'name', 'code', 'category', 'category_display',
            'unit', 'unit_display', 'supplier', 'notes',
            'low_stock_threshold', 'current_stock', 'is_low_stock',
            'stock_by_location', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['winery', 'created_at', 'updated_at']
    
    def get_current_stock(self, obj):
        return float(obj.get_current_stock())
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock()
    
    def get_stock_by_location(self, obj):
        return [
            {
                'location': stock.location,
                'location_display': stock.get_location_display(),
                'quantity': float(stock.quantity)
            }
            for stock in obj.stock_locations.all()
        ]


class MaterialCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating materials"""
    class Meta:
        model = Material
        fields = [
            'name', 'code', 'category', 'unit', 'supplier',
            'notes', 'low_stock_threshold', 'is_active'
        ]


class MaterialDropdownSerializer(serializers.ModelSerializer):
    """Compact serializer for dropdowns"""
    label = serializers.SerializerMethodField()
    
    class Meta:
        model = Material
        fields = ['id', 'name', 'code', 'category', 'unit', 'label']
    
    def get_label(self, obj):
        if obj.code:
            return f"{obj.name} ({obj.code})"
        return obj.name


class MaterialStockSerializer(serializers.ModelSerializer):
    """Serializer for stock levels"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    
    class Meta:
        model = MaterialStock
        fields = [
            'id', 'material', 'material_name', 'material_unit',
            'location', 'location_display', 'quantity', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class MaterialMovementListSerializer(serializers.ModelSerializer):
    """Serializer for movement list"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    destination_location_display = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = MaterialMovement
        fields = [
            'id', 'material', 'material_name', 'material_unit',
            'movement_type', 'movement_type_display', 'quantity',
            'location', 'location_display', 'destination_location',
            'destination_location_display', 'movement_date',
            'reference_number', 'unit_cost', 'notes',
            'created_by', 'created_by_name', 'created_at'
        ]
    
    def get_destination_location_display(self, obj):
        if obj.destination_location:
            return dict(MaterialMovement._meta.get_field('destination_location').choices)[obj.destination_location]
        return None


class MaterialMovementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating movements"""
    class Meta:
        model = MaterialMovement
        fields = [
            'material', 'movement_type', 'quantity', 'location',
            'destination_location', 'movement_date', 'reference_number',
            'unit_cost', 'notes'
        ]
    
    def validate(self, data):
        # Validate that TRANSFER has destination_location
        if data['movement_type'] == 'TRANSFER' and not data.get('destination_location'):
            raise serializers.ValidationError({
                'destination_location': 'Destination location is required for transfers'
            })
        
        # Validate that non-TRANSFER movements don't have destination_location
        if data['movement_type'] != 'TRANSFER' and data.get('destination_location'):
            raise serializers.ValidationError({
                'destination_location': 'Destination location is only for transfers'
            })
        
        return data


class AdditionListSerializer(serializers.ModelSerializer):
    """Serializer for addition list"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    material_category = serializers.CharField(source='material.get_category_display', read_only=True)
    target_display = serializers.CharField(source='get_target_display', read_only=True)
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)
    
    class Meta:
        model = Addition
        fields = [
            'id', 'material', 'material_name', 'material_unit', 'material_category',
            'quantity', 'target_display', 'tank', 'barrel', 'wine_lot', 'batch',
            'addition_date', 'purpose', 'dosage_rate', 'target_volume_l',
            'added_by', 'added_by_name', 'created_at'
        ]


class AdditionDetailSerializer(serializers.ModelSerializer):
    """Serializer for addition detail"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    target_display = serializers.CharField(source='get_target_display', read_only=True)
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)
    tank_code = serializers.CharField(source='tank.code', read_only=True)
    barrel_code = serializers.CharField(source='barrel.code', read_only=True)
    wine_lot_code = serializers.CharField(source='wine_lot.code', read_only=True)
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)
    
    class Meta:
        model = Addition
        fields = [
            'id', 'winery', 'material', 'material_name', 'material_unit',
            'quantity', 'tank', 'tank_code', 'barrel', 'barrel_code',
            'wine_lot', 'wine_lot_code', 'batch', 'batch_code',
            'target_display', 'addition_date', 'purpose', 'notes',
            'target_volume_l', 'dosage_rate', 'added_by', 'added_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['winery', 'created_at', 'updated_at']


class AdditionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating additions"""
    class Meta:
        model = Addition
        fields = [
            'material', 'quantity', 'tank', 'barrel', 'wine_lot', 'batch',
            'addition_date', 'purpose', 'notes', 'target_volume_l', 'dosage_rate'
        ]
    
    def validate(self, data):
        # Validate that exactly one target is specified
        targets = [data.get('tank'), data.get('barrel'), data.get('wine_lot'), data.get('batch')]
        target_count = sum(1 for t in targets if t is not None)
        
        if target_count == 0:
            raise serializers.ValidationError('You must specify one target (tank, barrel, wine lot, or batch)')
        
        if target_count > 1:
            raise serializers.ValidationError('You can only specify one target (tank, barrel, wine lot, or batch)')
        
        return data

