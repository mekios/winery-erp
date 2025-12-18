from rest_framework import serializers
from .models import Analysis


class AnalysisSerializer(serializers.ModelSerializer):
    """Full analysis serializer with all fields."""
    
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    molecular_so2 = serializers.FloatField(read_only=True)
    potential_alcohol = serializers.FloatField(read_only=True)
    bound_so2 = serializers.FloatField(read_only=True)
    mlf_progress = serializers.CharField(read_only=True)
    
    # Read-only display fields
    tank_code = serializers.CharField(source='tank.code', read_only=True)
    barrel_code = serializers.CharField(source='barrel.code', read_only=True)
    wine_lot_code = serializers.CharField(source='wine_lot.lot_code', read_only=True)
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)
    analyzed_by_name = serializers.CharField(source='analyzed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Analysis
        fields = [
            'id', 'winery', 'sample_type',
            'tank', 'tank_code',
            'barrel', 'barrel_code',
            'wine_lot', 'wine_lot_code',
            'batch', 'batch_code',
            'analysis_date', 'sample_date', 'temperature_c',
            # Basic parameters
            'ph', 'ta_gl', 'va_gl',
            # Sugar & density
            'brix', 'density', 'residual_sugar_gl',
            # SO₂
            'free_so2_mgl', 'total_so2_mgl',
            # Alcohol
            'alcohol_abv',
            # Organic acids
            'malic_acid_gl', 'lactic_acid_gl', 'tartaric_acid_gl', 'citric_acid_gl',
            # Color
            'color_intensity', 'color_hue',
            # Metadata
            'analyzed_by', 'analyzed_by_name', 'notes',
            'created_at', 'updated_at',
            # Computed fields
            'source_display', 'molecular_so2', 'potential_alcohol', 'bound_so2', 'mlf_progress',
        ]
        read_only_fields = ['id', 'winery', 'created_at', 'updated_at']


class AnalysisCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating analyses."""
    
    class Meta:
        model = Analysis
        fields = [
            'sample_type',
            'tank', 'barrel', 'wine_lot', 'batch',
            'analysis_date', 'sample_date', 'temperature_c',
            # Basic parameters
            'ph', 'ta_gl', 'va_gl',
            # Sugar & density
            'brix', 'density', 'residual_sugar_gl',
            # SO₂
            'free_so2_mgl', 'total_so2_mgl',
            # Alcohol
            'alcohol_abv',
            # Organic acids
            'malic_acid_gl', 'lactic_acid_gl', 'tartaric_acid_gl', 'citric_acid_gl',
            # Color
            'color_intensity', 'color_hue',
            # Metadata
            'notes',
        ]
    
    def validate(self, data):
        """Ensure at least one sample source is provided."""
        sample_type = data.get('sample_type', 'TANK')
        
        # Check that the appropriate source is provided based on sample_type
        source_map = {
            'TANK': 'tank',
            'BARREL': 'barrel',
            'WINE_LOT': 'wine_lot',
            'BATCH': 'batch',
        }
        
        if sample_type in source_map:
            field = source_map[sample_type]
            if not data.get(field):
                raise serializers.ValidationError({
                    field: f"A {field.replace('_', ' ')} must be selected for this sample type."
                })
        
        return data


class AnalysisListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""
    
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    molecular_so2 = serializers.FloatField(read_only=True)
    analyzed_by_name = serializers.CharField(source='analyzed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Analysis
        fields = [
            'id', 'sample_type', 'source_display',
            'analysis_date',
            'ph', 'ta_gl', 'va_gl',
            'brix', 'density', 'residual_sugar_gl',
            'free_so2_mgl', 'total_so2_mgl', 'molecular_so2',
            'alcohol_abv',
            'analyzed_by_name',
        ]


class AnalysisQuickEntrySerializer(serializers.ModelSerializer):
    """
    Quick entry serializer for common parameters only.
    Used for rapid data entry during production.
    """
    
    class Meta:
        model = Analysis
        fields = [
            'sample_type', 'tank', 'barrel', 'wine_lot', 'batch',
            'analysis_date', 'temperature_c',
            # Most common parameters
            'ph', 'ta_gl', 'va_gl',
            'brix', 'density',
            'free_so2_mgl', 'total_so2_mgl',
            'alcohol_abv',
            'notes',
        ]
    
    def validate(self, data):
        # Same validation as AnalysisCreateSerializer
        sample_type = data.get('sample_type', 'TANK')
        source_map = {
            'TANK': 'tank',
            'BARREL': 'barrel',
            'WINE_LOT': 'wine_lot',
            'BATCH': 'batch',
        }
        
        if sample_type in source_map:
            field = source_map[sample_type]
            if not data.get(field):
                raise serializers.ValidationError({
                    field: f"A {field.replace('_', ' ')} must be selected for this sample type."
                })
        
        return data


class AnalysisHistorySerializer(serializers.Serializer):
    """Serializer for historical analysis data (for charts)."""
    
    date = serializers.DateTimeField(source='analysis_date')
    ph = serializers.DecimalField(max_digits=4, decimal_places=2)
    ta_gl = serializers.DecimalField(max_digits=5, decimal_places=2)
    va_gl = serializers.DecimalField(max_digits=4, decimal_places=2)
    brix = serializers.DecimalField(max_digits=5, decimal_places=1)
    density = serializers.DecimalField(max_digits=6, decimal_places=4)
    free_so2_mgl = serializers.DecimalField(max_digits=5, decimal_places=1)
    total_so2_mgl = serializers.DecimalField(max_digits=5, decimal_places=1)
    molecular_so2 = serializers.FloatField()
    alcohol_abv = serializers.DecimalField(max_digits=4, decimal_places=1)
    malic_acid_gl = serializers.DecimalField(max_digits=5, decimal_places=2)
    lactic_acid_gl = serializers.DecimalField(max_digits=5, decimal_places=2)



