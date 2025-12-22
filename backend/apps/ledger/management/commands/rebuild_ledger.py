"""
Management command to rebuild the tank ledger from transfer history.

Usage:
    python manage.py rebuild_ledger                    # All wineries
    python manage.py rebuild_ledger --winery=<uuid>    # Specific winery
    python manage.py rebuild_ledger --dry-run          # Preview only
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.wineries.models import Winery
from apps.production.models import Transfer
from apps.ledger.models import TankLedger, CompositionKeyType, DerivedSource


class Command(BaseCommand):
    help = 'Rebuild the tank ledger from transfer history'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--winery',
            type=str,
            help='UUID of specific winery to rebuild (default: all)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without writing to database',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing ledger entries before rebuilding',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        clear = options['clear']
        winery_id = options.get('winery')
        
        # Get wineries to process
        if winery_id:
            wineries = Winery.objects.filter(id=winery_id)
            if not wineries.exists():
                self.stderr.write(self.style.ERROR(f'Winery {winery_id} not found'))
                return
        else:
            wineries = Winery.objects.all()
        
        self.stdout.write(f'Rebuilding ledger for {wineries.count()} winery(s)...')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be saved'))
        
        total_entries = 0
        total_transfers = 0
        
        for winery in wineries:
            entries, transfers = self._rebuild_winery(winery, dry_run, clear)
            total_entries += entries
            total_transfers += transfers
        
        self.stdout.write(self.style.SUCCESS(
            f'Done! Processed {total_transfers} transfers, created {total_entries} ledger entries'
        ))
    
    def _rebuild_winery(self, winery, dry_run, clear):
        """Rebuild ledger for a single winery."""
        self.stdout.write(f'  Processing winery: {winery.name}...')
        
        # Get all transfers for this winery, ordered by date
        transfers = Transfer.objects.filter(
            winery=winery
        ).select_related(
            'source_tank', 'destination_tank', 'batch', 'wine_lot'
        ).order_by('transfer_date', 'created_at')
        
        if clear and not dry_run:
            deleted, _ = TankLedger.objects.filter(winery=winery).delete()
            self.stdout.write(f'    Cleared {deleted} existing entries')
        
        entries_created = 0
        
        with transaction.atomic():
            for transfer in transfers:
                # Skip if ledger entries already exist (unless clearing)
                if not clear and TankLedger.objects.filter(transfer=transfer).exists():
                    continue
                
                entries = self._create_entries_for_transfer(transfer, dry_run)
                entries_created += entries
            
            if dry_run:
                # Rollback in dry-run mode
                transaction.set_rollback(True)
        
        self.stdout.write(f'    {transfers.count()} transfers, {entries_created} entries')
        return entries_created, transfers.count()
    
    def _create_entries_for_transfer(self, transfer, dry_run):
        """Create ledger entries for a single transfer."""
        entries = 0
        
        # Handle outflow from source tank
        if transfer.source_tank:
            entries += self._create_outflow_entries(transfer, dry_run)
        
        # Handle inflow to destination tank
        if transfer.destination_tank:
            entries += self._create_inflow_entries(transfer, dry_run)
        
        return entries
    
    def _create_outflow_entries(self, transfer, dry_run):
        """Create negative entries for volume leaving source tank."""
        from decimal import Decimal
        
        volume_out = -abs(transfer.volume_l)
        
        if transfer.batch:
            # Explicit attribution
            if not dry_run:
                TankLedger.objects.create(
                    winery=transfer.winery,
                    transfer=transfer,
                    event_datetime=transfer.transfer_date,
                    tank=transfer.source_tank,
                    delta_volume_l=volume_out,
                    composition_key_type=CompositionKeyType.BATCH,
                    composition_key_id=transfer.batch.id,
                    composition_key_label=transfer.batch.batch_code,
                    derived_source=DerivedSource.EXPLICIT,
                )
            return 1
        else:
            # Inherit from source composition
            composition = TankLedger.get_tank_composition(
                transfer.source_tank,
                as_of=transfer.transfer_date
            )
            
            total_volume = composition['total_volume_l']
            entries = 0
            
            if total_volume <= 0:
                # No composition - mark as unknown
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.source_tank,
                        delta_volume_l=volume_out,
                        composition_key_type=CompositionKeyType.UNKNOWN,
                        composition_key_id=None,
                        composition_key_label='Unknown (No Source)',
                        derived_source=DerivedSource.UNKNOWN,
                    )
                return 1
            
            # Handle unknown portion
            if composition['unknown_volume_l'] > 0:
                proportion = composition['unknown_volume_l'] / total_volume
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.source_tank,
                        delta_volume_l=volume_out * proportion,
                        composition_key_type=CompositionKeyType.UNKNOWN,
                        composition_key_id=None,
                        composition_key_label='Unknown (Inherited)',
                        derived_source=DerivedSource.INHERITED,
                    )
                entries += 1
            
            # Handle batch portions
            for batch_entry in composition['by_batch']:
                if batch_entry['volume_l'] <= 0:
                    continue
                proportion = batch_entry['volume_l'] / total_volume
                batch_volume = volume_out * proportion
                
                if abs(batch_volume) < Decimal('0.01'):
                    continue
                
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.source_tank,
                        delta_volume_l=batch_volume,
                        composition_key_type=CompositionKeyType.BATCH,
                        composition_key_id=batch_entry['batch_id'],
                        composition_key_label=batch_entry['label'],
                        derived_source=DerivedSource.INHERITED,
                    )
                entries += 1
            
            return entries
    
    def _create_inflow_entries(self, transfer, dry_run):
        """Create positive entries for volume entering destination tank."""
        from decimal import Decimal
        
        volume_in = abs(transfer.volume_l)
        
        if transfer.batch:
            # Explicit attribution
            if not dry_run:
                TankLedger.objects.create(
                    winery=transfer.winery,
                    transfer=transfer,
                    event_datetime=transfer.transfer_date,
                    tank=transfer.destination_tank,
                    delta_volume_l=volume_in,
                    composition_key_type=CompositionKeyType.BATCH,
                    composition_key_id=transfer.batch.id,
                    composition_key_label=transfer.batch.batch_code,
                    derived_source=DerivedSource.EXPLICIT,
                )
            return 1
        elif transfer.source_tank:
            # Inherit from source tank composition
            composition = TankLedger.get_tank_composition(
                transfer.source_tank,
                as_of=transfer.transfer_date
            )
            
            total_volume = composition['total_volume_l']
            entries = 0
            
            if total_volume <= 0:
                # No composition - mark as unknown
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.destination_tank,
                        delta_volume_l=volume_in,
                        composition_key_type=CompositionKeyType.UNKNOWN,
                        composition_key_id=None,
                        composition_key_label='Unknown (No Source)',
                        derived_source=DerivedSource.UNKNOWN,
                    )
                return 1
            
            # Handle unknown portion
            if composition['unknown_volume_l'] > 0:
                proportion = composition['unknown_volume_l'] / total_volume
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.destination_tank,
                        delta_volume_l=volume_in * proportion,
                        composition_key_type=CompositionKeyType.UNKNOWN,
                        composition_key_id=None,
                        composition_key_label='Unknown (Inherited)',
                        derived_source=DerivedSource.INHERITED,
                    )
                entries += 1
            
            # Handle batch portions
            for batch_entry in composition['by_batch']:
                if batch_entry['volume_l'] <= 0:
                    continue
                proportion = batch_entry['volume_l'] / total_volume
                batch_volume = volume_in * proportion
                
                if abs(batch_volume) < Decimal('0.01'):
                    continue
                
                if not dry_run:
                    TankLedger.objects.create(
                        winery=transfer.winery,
                        transfer=transfer,
                        event_datetime=transfer.transfer_date,
                        tank=transfer.destination_tank,
                        delta_volume_l=batch_volume,
                        composition_key_type=CompositionKeyType.BATCH,
                        composition_key_id=batch_entry['batch_id'],
                        composition_key_label=batch_entry['label'],
                        derived_source=DerivedSource.INHERITED,
                    )
                entries += 1
            
            return entries
        else:
            # External source - mark as unknown
            if not dry_run:
                TankLedger.objects.create(
                    winery=transfer.winery,
                    transfer=transfer,
                    event_datetime=transfer.transfer_date,
                    tank=transfer.destination_tank,
                    delta_volume_l=volume_in,
                    composition_key_type=CompositionKeyType.UNKNOWN,
                    composition_key_id=None,
                    composition_key_label='Unknown (External)',
                    derived_source=DerivedSource.UNKNOWN,
                )
            return 1

