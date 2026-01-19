from apps.harvest.models import Batch, BatchFraction

batch_2025_004 = Batch.objects.filter(batch_code='2025-004').first()

if batch_2025_004:
    print(f'Batch 2025-004: {batch_2025_004}')
    print(f'  Must Volume: {batch_2025_004.must_volume_l}L')
    print(f'  Harvest Date: {batch_2025_004.harvest_date}')
    
    fractions = BatchFraction.objects.filter(batch=batch_2025_004)
    print(f'  Fractions: {fractions.count()}')
    
    for f in fractions:
        tank_name = f.tank.code if f.tank else 'None'
        print(f'    - {f.fraction_type} | Tank: {tank_name} | {f.volume_l}L | Date: {f.separation_datetime}')
else:
    print('Batch 2025-004 not found')

