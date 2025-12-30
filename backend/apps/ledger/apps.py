from django.apps import AppConfig


class LedgerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ledger'
    verbose_name = 'Tank Composition Ledger'
    
    def ready(self):
        # Import signals when app is ready
        from . import signals  # noqa: F401





