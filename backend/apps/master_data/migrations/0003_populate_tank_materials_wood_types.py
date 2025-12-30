"""
Data migration to populate TankMaterial and WoodType with default values.
These are the values that were previously hardcoded in the Tank and Barrel models.
"""
from django.db import migrations


def populate_tank_materials(apps, schema_editor):
    TankMaterial = apps.get_model('master_data', 'TankMaterial')
    
    materials = [
        {'code': 'STAINLESS', 'name': 'Stainless Steel', 'sort_order': 1},
        {'code': 'CONCRETE', 'name': 'Concrete', 'sort_order': 2},
        {'code': 'FIBERGLASS', 'name': 'Fiberglass', 'sort_order': 3},
        {'code': 'OAK', 'name': 'Oak', 'sort_order': 4},
        {'code': 'PLASTIC', 'name': 'Food-Grade Plastic', 'sort_order': 5},
    ]
    
    for material in materials:
        TankMaterial.objects.get_or_create(
            code=material['code'],
            defaults={
                'name': material['name'],
                'sort_order': material['sort_order'],
                'is_active': True,
            }
        )


def populate_wood_types(apps, schema_editor):
    WoodType = apps.get_model('master_data', 'WoodType')
    
    wood_types = [
        {'code': 'FRENCH_OAK', 'name': 'French Oak', 'origin_country': 'France', 'sort_order': 1},
        {'code': 'AMERICAN_OAK', 'name': 'American Oak', 'origin_country': 'USA', 'sort_order': 2},
        {'code': 'HUNGARIAN_OAK', 'name': 'Hungarian Oak', 'origin_country': 'Hungary', 'sort_order': 3},
        {'code': 'ACACIA', 'name': 'Acacia', 'origin_country': '', 'sort_order': 4},
        {'code': 'CHESTNUT', 'name': 'Chestnut', 'origin_country': '', 'sort_order': 5},
    ]
    
    for wood_type in wood_types:
        WoodType.objects.get_or_create(
            code=wood_type['code'],
            defaults={
                'name': wood_type['name'],
                'origin_country': wood_type['origin_country'],
                'sort_order': wood_type['sort_order'],
                'is_active': True,
            }
        )


def reverse_populate(apps, schema_editor):
    """Remove the seeded data on reverse migration."""
    TankMaterial = apps.get_model('master_data', 'TankMaterial')
    WoodType = apps.get_model('master_data', 'WoodType')
    
    TankMaterial.objects.filter(code__in=[
        'STAINLESS', 'CONCRETE', 'FIBERGLASS', 'OAK', 'PLASTIC'
    ]).delete()
    
    WoodType.objects.filter(code__in=[
        'FRENCH_OAK', 'AMERICAN_OAK', 'HUNGARIAN_OAK', 'ACACIA', 'CHESTNUT'
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('master_data', '0002_add_global_tank_material_wood_type'),
    ]

    operations = [
        migrations.RunPython(populate_tank_materials, reverse_populate),
        migrations.RunPython(populate_wood_types, reverse_populate),
    ]




