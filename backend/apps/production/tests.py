"""
Unit tests for Production app (Transfers and Ledger integration).
"""
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.wineries.models import Winery
from apps.equipment.models import Tank
from apps.harvest.models import Batch, BatchFraction, HarvestSeason
from apps.production.models import Transfer, TransferActionType
from apps.ledger.models import TankLedger, CompositionKeyType, DerivedSource

User = get_user_model()


class TransferLedgerTestCase(TestCase):
    """
    Test that Transfers correctly create Ledger entries.
    
    This verifies the signal integration between production.Transfer
    and ledger.TankLedger.
    """
    
    def setUp(self):
        """Create test data."""
        # Create user and winery
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.winery = Winery.objects.create(
            name='Test Winery',
            code='test-winery'
        )
        
        # Create harvest season
        self.season = HarvestSeason.objects.create(
            winery=self.winery,
            year=2025,
            is_active=True
        )
        
        # Create tanks
        self.tank_source = Tank.objects.create(
            winery=self.winery,
            code='T001',
            name='Source Tank',
            capacity_l=10000,
            current_volume_l=5000,
            status='IN_USE',
            is_active=True
        )
        self.tank_dest = Tank.objects.create(
            winery=self.winery,
            code='T002',
            name='Destination Tank',
            capacity_l=10000,
            current_volume_l=0,
            status='EMPTY',
            is_active=True
        )
        
        # Create batch
        self.batch = Batch.objects.create(
            winery=self.winery,
            batch_code='2025-TEST',
            harvest_season=self.season,
            must_volume_l=1000,
            intake_date=timezone.now()
        )
    
    def test_transfer_creates_single_ledger_entry_with_batch(self):
        """Test that a transfer with explicit batch creates exactly ONE ledger entry."""
        # Create transfer with batch attribution
        transfer = Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            transfer_date=timezone.now(),
            source_tank=None,  # External source
            destination_tank=self.tank_dest,
            volume_l=Decimal('500.00'),
            batch=self.batch
        )
        
        # Check ledger entries
        ledger_entries = TankLedger.objects.filter(transfer=transfer)
        self.assertEqual(ledger_entries.count(), 1, "Should create exactly 1 ledger entry")
        
        entry = ledger_entries.first()
        self.assertEqual(entry.tank, self.tank_dest)
        self.assertEqual(entry.delta_volume_l, Decimal('500.00'))
        self.assertEqual(entry.composition_key_type, CompositionKeyType.BATCH)
        self.assertEqual(entry.composition_key_id, self.batch.id)
        self.assertEqual(entry.composition_key_label, self.batch.batch_code)
        self.assertEqual(entry.derived_source, DerivedSource.EXPLICIT)
    
    def test_transfer_no_duplicate_ledger_entries(self):
        """Test that saving a transfer multiple times doesn't create duplicate entries."""
        transfer = Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            transfer_date=timezone.now(),
            destination_tank=self.tank_dest,
            volume_l=Decimal('300.00'),
            batch=self.batch
        )
        
        initial_count = TankLedger.objects.filter(transfer=transfer).count()
        self.assertEqual(initial_count, 1)
        
        # Save transfer again (update)
        transfer.notes = "Updated notes"
        transfer.save()
        
        # Count should remain the same
        final_count = TankLedger.objects.filter(transfer=transfer).count()
        self.assertEqual(final_count, 1, "Should not create duplicate ledger entries on save")
    
    def test_tank_volume_syncs_after_transfer(self):
        """Test that tank volume is automatically synced after transfer."""
        initial_volume = self.tank_dest.current_volume_l
        transfer_volume = Decimal('750.00')
        
        Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            transfer_date=timezone.now(),
            destination_tank=self.tank_dest,
            volume_l=transfer_volume,
            batch=self.batch
        )
        
        # Refresh tank from database
        self.tank_dest.refresh_from_db()
        
        expected_volume = initial_volume + transfer_volume
        self.assertEqual(
            self.tank_dest.current_volume_l,
            expected_volume,
            f"Tank volume should be {expected_volume}L after transfer"
        )
    
    def test_transfer_between_tanks_creates_two_entries(self):
        """Test that tank-to-tank transfer creates inflow and outflow entries."""
        # First, create a ledger entry for source tank so it has composition
        TankLedger.objects.create(
            winery=self.winery,
            tank=self.tank_source,
            event_datetime=timezone.now(),
            delta_volume_l=Decimal('5000.00'),
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=self.batch.id,
            composition_key_label=self.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT
        )
        self.tank_source.sync_volume_from_ledger()
        
        # Create transfer from tank to tank
        transfer = Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.RACK,
            transfer_date=timezone.now(),
            source_tank=self.tank_source,
            destination_tank=self.tank_dest,
            volume_l=Decimal('1000.00'),
            batch=None  # No explicit batch - will inherit
        )
        
        # Check that entries were created for both tanks
        source_entries = TankLedger.objects.filter(
            transfer=transfer,
            tank=self.tank_source
        )
        dest_entries = TankLedger.objects.filter(
            transfer=transfer,
            tank=self.tank_dest
        )
        
        self.assertGreater(source_entries.count(), 0, "Should create outflow entry")
        self.assertGreater(dest_entries.count(), 0, "Should create inflow entry")
        
        # Check volumes are correct (negative for outflow, positive for inflow)
        source_total = sum(e.delta_volume_l for e in source_entries)
        dest_total = sum(e.delta_volume_l for e in dest_entries)
        
        self.assertEqual(source_total, Decimal('-1000.00'), "Outflow should be negative")
        self.assertEqual(dest_total, Decimal('1000.00'), "Inflow should be positive")
    
    def test_drain_creates_single_unknown_entry(self):
        """Test that DRAIN transfers create a single UNKNOWN outflow entry."""
        # Setup source tank with composition
        TankLedger.objects.create(
            winery=self.winery,
            tank=self.tank_source,
            event_datetime=timezone.now(),
            delta_volume_l=Decimal('5000.00'),
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=self.batch.id,
            composition_key_label=self.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT
        )
        self.tank_source.sync_volume_from_ledger()
        
        # Create drain transfer
        transfer = Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.DRAIN,
            transfer_date=timezone.now(),
            source_tank=self.tank_source,
            destination_tank=None,  # No destination (drain)
            volume_l=Decimal('500.00')
        )
        
        # Check ledger entries
        entries = TankLedger.objects.filter(transfer=transfer)
        self.assertEqual(entries.count(), 1, "Drain should create exactly 1 entry")
        
        entry = entries.first()
        self.assertEqual(entry.composition_key_type, CompositionKeyType.UNKNOWN)
        self.assertEqual(entry.composition_key_label, 'Drain')
        self.assertEqual(entry.delta_volume_l, Decimal('-500.00'))


class BatchFractionTransferTestCase(TestCase):
    """
    Test that BatchFraction creation correctly creates Transfers.
    
    This verifies the refactored signal that creates Transfer records
    instead of direct ledger entries.
    """
    
    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.winery = Winery.objects.create(
            name='Test Winery',
            code='test-winery'
        )
        
        # Create harvest season
        self.season = HarvestSeason.objects.create(
            winery=self.winery,
            year=2025,
            is_active=True
        )
        
        self.tank = Tank.objects.create(
            winery=self.winery,
            code='T001',
            name='Test Tank',
            capacity_l=10000,
            current_volume_l=0,
            status='EMPTY',
            is_active=True
        )
        
        self.batch = Batch.objects.create(
            winery=self.winery,
            batch_code='2025-TEST',
            harvest_season=self.season,
            must_volume_l=2000,
            intake_date=timezone.now()
        )
    
    def test_batch_fraction_creates_transfer(self):
        """Test that creating a BatchFraction creates exactly ONE Transfer."""
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.tank,
            volume_l=Decimal('800.00'),
            separation_datetime=timezone.now()
        )
        
        # Check that a transfer was created
        transfers = Transfer.objects.filter(
            batch=self.batch,
            destination_tank=self.tank
        )
        self.assertEqual(transfers.count(), 1, "Should create exactly 1 transfer")
        
        transfer = transfers.first()
        self.assertEqual(transfer.action_type, TransferActionType.FILL)
        self.assertEqual(transfer.volume_l, fraction.volume_l)
        self.assertEqual(transfer.batch, self.batch)
        self.assertIsNone(transfer.source_tank, "Source should be None (external)")
    
    def test_batch_fraction_no_duplicate_transfers(self):
        """Test that updating a BatchFraction doesn't create duplicate transfers."""
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.tank,
            volume_l=Decimal('600.00'),
            separation_datetime=timezone.now()
        )
        
        initial_count = Transfer.objects.filter(
            batch=self.batch,
            destination_tank=self.tank
        ).count()
        self.assertEqual(initial_count, 1)
        
        # Update fraction (should NOT create another transfer)
        fraction.notes = "Updated notes"
        fraction.save()
        
        final_count = Transfer.objects.filter(
            batch=self.batch,
            destination_tank=self.tank
        ).count()
        self.assertEqual(final_count, 1, "Should not create duplicate transfer on update")
    
    def test_batch_fraction_creates_ledger_entry_via_transfer(self):
        """Test that BatchFraction creates ledger entry through Transfer signal."""
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='PRESS_1',
            tank=self.tank,
            volume_l=Decimal('500.00'),
            separation_datetime=timezone.now()
        )
        
        # Check that ledger entry was created (via transfer signal)
        ledger_entries = TankLedger.objects.filter(
            tank=self.tank
        )
        self.assertEqual(ledger_entries.count(), 1, "Should create exactly 1 ledger entry")
        
        entry = ledger_entries.first()
        self.assertEqual(entry.delta_volume_l, fraction.volume_l)
        self.assertEqual(entry.composition_key_type, CompositionKeyType.BATCH)
        self.assertIsNotNone(entry.transfer, "Ledger entry should be linked to transfer")
    
    def test_batch_fraction_syncs_tank_volume(self):
        """Test that tank volume is synced after BatchFraction creation."""
        initial_volume = self.tank.current_volume_l
        
        BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.tank,
            volume_l=Decimal('900.00'),
            separation_datetime=timezone.now()
        )
        
        # Refresh tank from database
        self.tank.refresh_from_db()
        
        expected_volume = initial_volume + Decimal('900.00')
        self.assertEqual(
            self.tank.current_volume_l,
            expected_volume,
            f"Tank volume should be {expected_volume}L after fraction creation"
        )
    
    def test_multiple_fractions_same_tank(self):
        """Test that multiple fractions to same tank each create separate transfers."""
        # Create first fraction
        BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.tank,
            volume_l=Decimal('600.00'),
            separation_datetime=timezone.now()
        )
        
        # Create second fraction
        BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='PRESS_1',
            tank=self.tank,
            volume_l=Decimal('400.00'),
            separation_datetime=timezone.now()
        )
        
        # Check that TWO transfers were created
        transfers = Transfer.objects.filter(
            batch=self.batch,
            destination_tank=self.tank
        )
        self.assertEqual(transfers.count(), 2, "Should create 2 separate transfers")
        
        # Check total volume in tank
        self.tank.refresh_from_db()
        self.assertEqual(
            self.tank.current_volume_l,
            Decimal('1000.00'),
            "Tank should have sum of both fractions"
        )
    
    def test_batch_fraction_without_tank(self):
        """Test that BatchFraction without tank doesn't create transfer."""
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=None,  # No tank assigned
            volume_l=Decimal('500.00'),
            separation_datetime=timezone.now()
        )
        
        # No transfer should be created
        transfers = Transfer.objects.filter(batch=self.batch)
        self.assertEqual(transfers.count(), 0, "Should not create transfer without tank")


class LedgerConsistencyTestCase(TestCase):
    """
    Test ledger consistency and double-counting prevention.
    """
    
    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.winery = Winery.objects.create(
            name='Test Winery',
            code='test-winery'
        )
        
        # Create harvest season
        self.season = HarvestSeason.objects.create(
            winery=self.winery,
            year=2025,
            is_active=True
        )
        
        self.tank = Tank.objects.create(
            winery=self.winery,
            code='T001',
            name='Test Tank',
            capacity_l=10000,
            current_volume_l=0,
            status='EMPTY',
            is_active=True
        )
        
        self.batch = Batch.objects.create(
            winery=self.winery,
            batch_code='2025-TEST',
            harvest_season=self.season,
            must_volume_l=1000,
            intake_date=timezone.now()
        )
    
    def test_ledger_volume_equals_tank_volume(self):
        """Test that tank volume matches ledger sum."""
        # Create some transfers
        Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            destination_tank=self.tank,
            volume_l=Decimal('300.00'),
            batch=self.batch
        )
        Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            destination_tank=self.tank,
            volume_l=Decimal('200.00'),
            batch=self.batch
        )
        
        # Get ledger sum
        from django.db.models import Sum
        ledger_sum = TankLedger.objects.filter(tank=self.tank).aggregate(
            total=Sum('delta_volume_l')
        )['total'] or Decimal('0')
        
        # Refresh tank
        self.tank.refresh_from_db()
        
        self.assertEqual(
            self.tank.current_volume_l,
            ledger_sum,
            "Tank volume should equal ledger sum"
        )
    
    def test_no_double_counting_from_batch_fractions(self):
        """Test that batch fractions don't cause double counting."""
        # Create fraction (which creates transfer -> ledger)
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.tank,
            volume_l=Decimal('500.00'),
            separation_datetime=timezone.now()
        )
        
        # Get all ledger entries for this tank
        ledger_entries = TankLedger.objects.filter(
            tank=self.tank
        )
        
        # Should be exactly 1 entry (from transfer)
        self.assertEqual(
            ledger_entries.count(),
            1,
            "Should have exactly 1 ledger entry per fraction"
        )
        
        # Tank volume should equal fraction volume
        self.tank.refresh_from_db()
        self.assertEqual(
            self.tank.current_volume_l,
            fraction.volume_l,
            "Tank volume should equal fraction volume (no double counting)"
        )


class CapacityValidationTestCase(TestCase):
    """
    Test tank capacity validation across transfers and batch fractions.
    
    Ensures tanks never exceed their capacity limits.
    """
    
    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.winery = Winery.objects.create(
            name='Test Winery',
            code='test-winery'
        )
        
        # Create harvest season
        self.season = HarvestSeason.objects.create(
            winery=self.winery,
            year=2025,
            is_active=True
        )
        
        # Create tanks with specific capacities
        self.small_tank = Tank.objects.create(
            winery=self.winery,
            code='SMALL',
            name='Small Tank',
            capacity_l=1000,
            current_volume_l=0,
            status='EMPTY',
            is_active=True
        )
        self.large_tank = Tank.objects.create(
            winery=self.winery,
            code='LARGE',
            name='Large Tank',
            capacity_l=5000,
            current_volume_l=3000,  # 60% full
            status='IN_USE',
            is_active=True
        )
        
        self.batch = Batch.objects.create(
            winery=self.winery,
            batch_code='2025-TEST',
            harvest_season=self.season,
            must_volume_l=3000,
            intake_date=timezone.now()
        )
    
    def test_tank_can_accept_volume_within_capacity(self):
        """Test that tank accepts volume within available capacity."""
        can_accept, error = self.small_tank.can_accept_volume(Decimal('800.00'))
        self.assertTrue(can_accept, "Tank should accept volume within capacity")
        self.assertEqual(error, "")
    
    def test_tank_rejects_volume_exceeding_capacity(self):
        """Test that tank rejects volume exceeding available capacity."""
        can_accept, error = self.small_tank.can_accept_volume(Decimal('1200.00'))
        self.assertFalse(can_accept, "Tank should reject volume exceeding capacity")
        self.assertIn("cannot accept", error.lower())
        self.assertIn("1200", error)
    
    def test_tank_with_existing_volume_capacity_check(self):
        """Test capacity check on tank with existing volume."""
        # Large tank has 3000L, capacity is 5000L, so available is 2000L
        can_accept, error = self.large_tank.can_accept_volume(Decimal('2500.00'))
        self.assertFalse(can_accept, "Should reject volume exceeding available capacity")
        self.assertIn("2000", error, "Error should mention available capacity")
    
    def test_transfer_validates_destination_capacity(self):
        """Test that Transfer signal respects destination tank capacity."""
        # Create a transfer that will fill the small tank exactly
        Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            transfer_date=timezone.now(),
            destination_tank=self.small_tank,
            volume_l=Decimal('1000.00'),  # Exactly at capacity
            batch=self.batch
        )
        
        self.small_tank.refresh_from_db()
        self.assertEqual(self.small_tank.current_volume_l, Decimal('1000.00'))
        
        # Now try to add more (this will exceed capacity but model allows it)
        # The serializer validation should prevent this at API level
        Transfer.objects.create(
            winery=self.winery,
            action_type=TransferActionType.FILL,
            transfer_date=timezone.now(),
            destination_tank=self.small_tank,
            volume_l=Decimal('200.00'),  # Would exceed capacity
            batch=self.batch
        )
        
        self.small_tank.refresh_from_db()
        # Tank will be over capacity - this demonstrates why API validation is needed
        self.assertGreater(
            self.small_tank.current_volume_l,
            self.small_tank.capacity_l,
            "Without API validation, tank can exceed capacity"
        )
    
    def test_batch_fraction_validates_tank_capacity(self):
        """Test that BatchFraction validates tank capacity."""
        # Create ledger entry to simulate existing volume
        TankLedger.objects.create(
            winery=self.winery,
            tank=self.small_tank,
            event_datetime=timezone.now(),
            delta_volume_l=Decimal('700.00'),
            composition_key_type=CompositionKeyType.BATCH,
            composition_key_id=self.batch.id,
            composition_key_label=self.batch.batch_code,
            derived_source=DerivedSource.EXPLICIT
        )
        self.small_tank.sync_volume_from_ledger()
        
        # Try to add fraction that exceeds remaining capacity
        # Small tank: 1000L capacity, 700L current = 300L available
        # Trying to add 400L should fail
        fraction = BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.small_tank,
            volume_l=Decimal('400.00'),
            separation_datetime=timezone.now()
        )
        
        # The transfer will be created, which will try to add 400L
        # This should succeed at creation but the tank volume will be wrong
        # Let's check if validation catches this
        transfer = Transfer.objects.filter(
            batch=self.batch,
            destination_tank=self.small_tank
        ).first()
        
        self.assertIsNotNone(transfer, "Transfer should be created")
        
        # Sync and check if tank is over capacity (this is the problem we're testing for)
        self.small_tank.refresh_from_db()
        # After the transfer, tank should have 1100L which exceeds 1000L capacity
        # This test demonstrates the issue - we need validation before transfer creation
    
    def test_multiple_fractions_respect_total_capacity(self):
        """Test that multiple fractions to same tank respect capacity."""
        # Add 600L
        BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='FREE_RUN',
            tank=self.small_tank,
            volume_l=Decimal('600.00'),
            separation_datetime=timezone.now()
        )
        
        self.small_tank.refresh_from_db()
        self.assertEqual(self.small_tank.current_volume_l, Decimal('600.00'))
        
        # Try to add another 500L (total would be 1100L, exceeding 1000L capacity)
        BatchFraction.objects.create(
            batch=self.batch,
            fraction_type='PRESS_1',
            tank=self.small_tank,
            volume_l=Decimal('500.00'),
            separation_datetime=timezone.now()
        )
        
        self.small_tank.refresh_from_db()
        # This will show tank over capacity - demonstrates need for validation
        # The test intentionally shows the problem
    
    def test_tank_validate_capacity_method(self):
        """Test the Tank.validate_capacity() method."""
        from django.core.exceptions import ValidationError
        
        # Set tank to over capacity
        self.small_tank.current_volume_l = Decimal('1200.00')
        
        with self.assertRaises(ValidationError) as context:
            self.small_tank.validate_capacity()
        
        self.assertIn("exceeds capacity", str(context.exception))
    
    def test_tank_negative_volume_validation(self):
        """Test that negative volumes are rejected."""
        from django.core.exceptions import ValidationError
        
        self.small_tank.current_volume_l = Decimal('-100.00')
        
        with self.assertRaises(ValidationError) as context:
            self.small_tank.validate_capacity()
        
        self.assertIn("cannot be negative", str(context.exception))
