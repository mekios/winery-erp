from apps.harvest.models import BatchFraction, Batch
from apps.ledger.models import TankLedger, CompositionKeyType, DerivedSource
from apps.equipment.models import Tank

# Get all batch fractions
fractions = BatchFraction.objects.filter(tank__isnull=False).select_related('batch', 'tank', 'winery')

print(f'Found {fractions.count()} batch fractions with tanks assigned\n')

for fraction in fractions:
    # Check if ledger entry exists
    existing = TankLedger.objects.filter(
        batch=fraction.batch,
        tank=fraction.tank,
        composition_key_type=CompositionKeyType.BATCH
    ).exists()
    
    if not existing:
        print(f'Creating ledger entry for: {fraction.batch.batch_code} -> Tank {fraction.tank.code} ({fraction.volume_l}L)')
        
        TankLedger.objects.create(
            winery=fraction.winery,
            batch=fraction.batch,
            event_datetime=fraction.separation_datetime or fraction.created_at,
            tank=fraction.tank,
            delta_volume_l=fraction.volume_l,
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=fraction.batch.id,
            composition_key_label=fraction.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT,
        )
        
        # Sync tank volume
        fraction.tank.sync_volume_from_ledger()
        print(f'  ✓ Created and synced tank volume: {fraction.tank.current_volume_l}L\n')
    else:
        print(f'Ledger entry already exists for: {fraction.batch.batch_code} -> Tank {fraction.tank.code}')

print('\nDone!')

