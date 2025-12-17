"""
Winery and WineryMembership models for multi-tenancy.
"""
import uuid

from django.conf import settings
from django.db import models


class Winery(models.Model):
    """
    Represents a winery organization.
    All tenant-scoped data will have a foreign key to this model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Location
    country = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    
    # Settings
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wineries'
        verbose_name = 'winery'
        verbose_name_plural = 'wineries'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class WineryMembershipRole(models.TextChoices):
    """Roles for winery membership."""
    CONSULTANT = 'CONSULTANT', 'Consultant'
    WINERY_OWNER = 'WINERY_OWNER', 'Winery Owner'
    WINEMAKER = 'WINEMAKER', 'Winemaker'
    CELLAR_STAFF = 'CELLAR_STAFF', 'Cellar Staff'
    LAB = 'LAB', 'Lab Personnel'


class WineryMembership(models.Model):
    """
    Links users to wineries with specific roles.
    A user can belong to multiple wineries (especially consultants).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='winery_memberships'
    )
    winery = models.ForeignKey(
        Winery,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=WineryMembershipRole.choices,
        default=WineryMembershipRole.CELLAR_STAFF
    )
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'winery_memberships'
        verbose_name = 'winery membership'
        verbose_name_plural = 'winery memberships'
        unique_together = ['user', 'winery']
        ordering = ['winery__name', 'user__email']

    def __str__(self):
        return f"{self.user.email} - {self.winery.name} ({self.role})"

    @property
    def is_admin(self):
        """Check if the user has admin-level access."""
        return self.role in [
            WineryMembershipRole.CONSULTANT,
            WineryMembershipRole.WINERY_OWNER
        ]



