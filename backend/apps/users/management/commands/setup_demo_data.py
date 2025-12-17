"""
Management command to set up demo data for Winery ERP.
Run with: python manage.py setup_demo_data
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates demo users, wineries, and sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='demo123',
            help='Password for demo users (default: demo123)'
        )

    def handle(self, *args, **options):
        password = options['password']
        
        self.stdout.write('🍷 Setting up Winery ERP demo data...\n')

        # Create demo users
        self.stdout.write('Creating demo users...')
        users = self._create_users(password)
        
        # Create demo winery
        self.stdout.write('Creating demo winery...')
        winery = self._create_winery(users)
        
        # Create master data
        self.stdout.write('Creating master data...')
        varieties = self._create_varieties(winery)
        grower = self._create_growers(winery)
        
        # Create equipment
        self.stdout.write('Creating equipment...')
        tanks = self._create_tanks(winery)
        
        # Create harvest data
        self.stdout.write('Creating harvest data...')
        season, batches = self._create_harvest_data(winery, varieties, grower, tanks)
        
        # Create lab analyses
        self.stdout.write('Creating lab analyses...')
        self._create_analyses(winery, tanks, users['winemaker'])
        
        # Create transfers
        self.stdout.write('Creating transfers...')
        self._create_transfers(winery, tanks, users['winemaker'])
        
        self.stdout.write(self.style.SUCCESS('\n✅ Demo data created successfully!\n'))
        self.stdout.write('Demo Users:')
        self.stdout.write(f'  admin@winery.com / {password}')
        self.stdout.write(f'  consultant@winery.com / {password}')
        self.stdout.write(f'  owner@winery.com / {password}')
        self.stdout.write(f'  winemaker@winery.com / {password}')

    def _create_users(self, password):
        users = {}
        
        # Admin/Superuser
        admin, _ = User.objects.get_or_create(
            email='admin@winery.com',
            defaults={
                'full_name': 'System Administrator',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password(password)
        admin.save()
        users['admin'] = admin
        
        # Consultant
        consultant, _ = User.objects.get_or_create(
            email='consultant@winery.com',
            defaults={'full_name': 'Maria Consultant'}
        )
        consultant.set_password(password)
        consultant.save()
        users['consultant'] = consultant
        
        # Winery Owner
        owner, _ = User.objects.get_or_create(
            email='owner@winery.com',
            defaults={'full_name': 'John Owner'}
        )
        owner.set_password(password)
        owner.save()
        users['owner'] = owner
        
        # Winemaker
        winemaker, _ = User.objects.get_or_create(
            email='winemaker@winery.com',
            defaults={'full_name': 'Elena Winemaker'}
        )
        winemaker.set_password(password)
        winemaker.save()
        users['winemaker'] = winemaker
        
        self.stdout.write(f'  Created {len(users)} users')
        return users

    def _create_winery(self, users):
        from apps.wineries.models import Winery, WineryMembership
        
        winery, created = Winery.objects.get_or_create(
            code='DEMO',
            defaults={
                'name': 'Demo Winery',
                'country': 'Greece',
                'region': 'Nemea',
                'address': '123 Vineyard Road, Nemea, Greece',
                'timezone': 'Europe/Athens',
            }
        )
        
        # Add memberships
        memberships = [
            (users['consultant'], 'CONSULTANT'),
            (users['owner'], 'WINERY_OWNER'),
            (users['winemaker'], 'WINEMAKER'),
            (users['admin'], 'WINERY_OWNER'),
        ]
        
        for user, role in memberships:
            WineryMembership.objects.get_or_create(
                winery=winery,
                user=user,
                defaults={'role': role, 'is_active': True}
            )
        
        self.stdout.write(f'  Created winery: {winery.name}')
        return winery

    def _create_varieties(self, winery):
        from apps.master_data.models import GrapeVariety
        
        variety_data = [
            ('Agiorgitiko', 'RED', 'Indigenous Greek variety from Nemea'),
            ('Moschofilero', 'WHITE', 'Aromatic Greek variety'),
            ('Assyrtiko', 'WHITE', 'Famous Santorini variety'),
            ('Xinomavro', 'RED', 'Noble Greek variety'),
            ('Malagousia', 'WHITE', 'Revived Greek variety'),
        ]
        
        varieties = []
        for name, color, notes in variety_data:
            variety, _ = GrapeVariety.objects.get_or_create(
                winery=winery,
                name=name,
                defaults={'color': color, 'notes': notes}
            )
            varieties.append(variety)
        
        self.stdout.write(f'  Created {len(varieties)} grape varieties')
        return varieties

    def _create_growers(self, winery):
        from apps.master_data.models import Grower
        
        grower, _ = Grower.objects.get_or_create(
            winery=winery,
            name='Nemea Cooperative',
            defaults={
                'contact_email': 'info@nemea-coop.gr',
                'contact_phone': '+30 123 456 7890',
                'address': 'Nemea, Corinthia, Greece',
            }
        )
        
        self.stdout.write(f'  Created grower: {grower.name}')
        return grower

    def _create_tanks(self, winery):
        from apps.equipment.models import Tank
        
        tank_data = [
            ('A01', 'Fermentation Tank 1', Decimal('5000'), 'STAINLESS', 'IN_USE', Decimal('1500')),
            ('A02', 'Fermentation Tank 2', Decimal('5000'), 'STAINLESS', 'IN_USE', Decimal('2500')),
            ('B01', 'Storage Tank 1', Decimal('10000'), 'STAINLESS', 'IN_USE', Decimal('7000')),
            ('B02', 'Storage Tank 2', Decimal('10000'), 'STAINLESS', 'IN_USE', Decimal('9000')),
        ]
        
        tanks = []
        for code, name, capacity, material, status, volume in tank_data:
            tank, _ = Tank.objects.update_or_create(
                winery=winery,
                code=code,
                defaults={
                    'name': name,
                    'capacity_l': capacity,
                    'material': material,
                    'status': status,
                    'current_volume_l': volume,
                }
            )
            tanks.append(tank)
        
        self.stdout.write(f'  Created {len(tanks)} tanks')
        return tanks

    def _create_harvest_data(self, winery, varieties, grower, tanks):
        from apps.harvest.models import HarvestSeason, Batch
        
        # Create current season
        current_year = timezone.now().year
        season, _ = HarvestSeason.objects.get_or_create(
            winery=winery,
            year=current_year,
            defaults={
                'name': f'Harvest {current_year}',
                'is_active': True,
            }
        )
        
        # Create batches
        batches = []
        for i, variety in enumerate(varieties[:2]):
            batch, _ = Batch.objects.get_or_create(
                winery=winery,
                batch_code=f'{current_year}-{variety.name[:3].upper()}-001',
                defaults={
                    'harvest_season': season,
                    'intake_date': timezone.now().date(),
                    'source_type': 'GROWER',
                    'initial_tank': tanks[i],
                    'grape_weight_kg': Decimal('5000'),
                    'must_volume_l': Decimal('3500'),
                    'stage': 'CRUSH',
                }
            )
            batches.append(batch)
        
        self.stdout.write(f'  Created season {season.name} with {len(batches)} batches')
        return season, batches

    def _create_analyses(self, winery, tanks, user):
        from apps.lab.models import Analysis
        
        analysis_data = [
            (tanks[0], Decimal('3.42'), Decimal('6.5'), Decimal('0.35'), Decimal('32')),
            (tanks[1], Decimal('3.38'), Decimal('7.0'), Decimal('0.28'), Decimal('28')),
            (tanks[2], Decimal('3.55'), Decimal('5.8'), Decimal('0.45'), Decimal('15')),  # Low SO2 alert
        ]
        
        count = 0
        for tank, ph, ta, va, so2 in analysis_data:
            Analysis.objects.get_or_create(
                winery=winery,
                tank=tank,
                analysis_date=timezone.now().date(),
                defaults={
                    'sample_type': 'TANK',
                    'ph': ph,
                    'ta_gl': ta,
                    'va_gl': va,
                    'free_so2_mgl': so2,
                    'total_so2_mgl': so2 * 3,
                    'analyzed_by': user,
                }
            )
            count += 1
        
        self.stdout.write(f'  Created {count} analyses')

    def _create_transfers(self, winery, tanks, user):
        from apps.production.models import Transfer
        
        # Create sample transfers
        Transfer.objects.get_or_create(
            winery=winery,
            source_tank=tanks[0],
            destination_tank=tanks[1],
            defaults={
                'action_type': 'RACK',
                'volume_l': Decimal('500'),
                'temperature_c': Decimal('16'),
                'performed_by': user,
                'notes': 'Racking off lees',
            }
        )
        
        Transfer.objects.get_or_create(
            winery=winery,
            destination_tank=tanks[2],
            defaults={
                'action_type': 'TOP_UP',
                'volume_l': Decimal('100'),
                'temperature_c': Decimal('15'),
                'performed_by': user,
                'notes': 'Topping up after sampling',
            }
        )
        
        self.stdout.write(f'  Created 2 transfers')

