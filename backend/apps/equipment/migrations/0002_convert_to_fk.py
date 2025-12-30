"""
Migration to convert Tank.material and Barrel.wood_type from CharField to ForeignKey.
"""
from django.db import migrations, models
import django.db.models.deletion


def convert_tank_materials(apps, schema_editor):
    """Convert Tank.material_code to Tank.material FK."""
    Tank = apps.get_model('equipment', 'Tank')
    TankMaterial = apps.get_model('master_data', 'TankMaterial')
    
    for tank in Tank.objects.all():
        if tank.material_code:
            material = TankMaterial.objects.filter(code=tank.material_code).first()
            if material:
                tank.material = material
                tank.save(update_fields=['material'])


def convert_barrel_wood_types(apps, schema_editor):
    """Convert Barrel.wood_type_code to Barrel.wood_type FK."""
    Barrel = apps.get_model('equipment', 'Barrel')
    WoodType = apps.get_model('master_data', 'WoodType')
    
    for barrel in Barrel.objects.all():
        if barrel.wood_type_code:
            wood_type = WoodType.objects.filter(code=barrel.wood_type_code).first()
            if wood_type:
                barrel.wood_type = wood_type
                barrel.save(update_fields=['wood_type'])


def reverse_tank_materials(apps, schema_editor):
    """Convert Tank.material FK back to Tank.material_code."""
    Tank = apps.get_model('equipment', 'Tank')
    
    for tank in Tank.objects.all():
        if tank.material:
            tank.material_code = tank.material.code
            tank.save(update_fields=['material_code'])


def reverse_barrel_wood_types(apps, schema_editor):
    """Convert Barrel.wood_type FK back to Barrel.wood_type_code."""
    Barrel = apps.get_model('equipment', 'Barrel')
    
    for barrel in Barrel.objects.all():
        if barrel.wood_type:
            barrel.wood_type_code = barrel.wood_type.code
            barrel.save(update_fields=['wood_type_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0001_initial'),
        ('master_data', '0003_populate_tank_materials_wood_types'),
    ]

    operations = [
        # Step 1: Rename old CharField fields to *_code
        migrations.RenameField(
            model_name='tank',
            old_name='material',
            new_name='material_code',
        ),
        migrations.RenameField(
            model_name='barrel',
            old_name='wood_type',
            new_name='wood_type_code',
        ),
        
        # Step 2: Add new FK fields
        migrations.AddField(
            model_name='tank',
            name='material',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tanks',
                to='master_data.tankmaterial',
            ),
        ),
        migrations.AddField(
            model_name='barrel',
            name='wood_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='barrels',
                to='master_data.woodtype',
            ),
        ),
        
        # Step 3: Convert data from old string to new FK
        migrations.RunPython(convert_tank_materials, reverse_tank_materials),
        migrations.RunPython(convert_barrel_wood_types, reverse_barrel_wood_types),
        
        # Step 4: Remove old CharField fields
        migrations.RemoveField(
            model_name='tank',
            name='material_code',
        ),
        migrations.RemoveField(
            model_name='barrel',
            name='wood_type_code',
        ),
    ]




