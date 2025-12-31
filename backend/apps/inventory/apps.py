from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.inventory'
    verbose_name = 'Inventory & Materials'
    
    def ready(self):
        try:
            import apps.inventory.signals  # noqa: F401
        except ImportError:
            pass

