# 👥 Winery ERP — Demo Users & Test Data

> This document contains demo credentials for testing the application.  
> **⚠️ Do NOT use these credentials in production!**

---

## Demo Users

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@winery.com` | `admin123` | **Superuser** | Full Django admin access, can manage all data |
| `consultant@winery.com` | `demo123` | **Consultant** | Oversees all wineries, creates instructions |
| `owner@winery.com` | `demo123` | **Winery Owner** | Full access to Demo Winery |
| `winemaker@winery.com` | `demo123` | **Winemaker** | Production access to Demo Winery |

---

## Demo Winery

| Field | Value |
|-------|-------|
| **Name** | Demo Winery |
| **Code** | DEMO |
| **Country** | Greece |
| **Region** | Macedonia |
| **Address** | 123 Vineyard Road |

---

## Role Permissions

| Role | View Data | Create/Edit | Manage Users | Admin Panel |
|------|-----------|-------------|--------------|-------------|
| **Superuser** | ✅ All | ✅ All | ✅ | ✅ |
| **Consultant** | ✅ All wineries | ✅ All | ❌ | ❌ |
| **Winery Owner** | ✅ Own winery | ✅ Own winery | ✅ Own winery | ❌ |
| **Winemaker** | ✅ Own winery | ✅ Production | ❌ | ❌ |
| **Cellar Staff** | ✅ Own winery | ✅ Execute tasks | ❌ | ❌ |
| **Lab** | ✅ Own winery | ✅ Analyses only | ❌ | ❌ |

---

## Access Points (Development)

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:4201 |
| **Backend API** | http://localhost:8001/api/v1/ |
| **API Documentation** | http://localhost:8001/api/docs/ |
| **Admin Panel** | http://localhost:8001/admin/ |

---

## Recreating Demo Data

If you need to reset the demo data, run:

```bash
# From project root
docker compose exec backend python manage.py shell -c "
from apps.users.models import User
from apps.wineries.models import Winery, WineryMembership

# Clear existing demo data
User.objects.filter(email__endswith='@winery.com').delete()
Winery.objects.filter(code='DEMO').delete()

# Create demo users
admin = User.objects.create_superuser('admin@winery.com', 'admin123', full_name='Admin User')
consultant = User.objects.create_user('consultant@winery.com', 'demo123', full_name='Maria Consultant')
owner = User.objects.create_user('owner@winery.com', 'demo123', full_name='John Owner')
winemaker = User.objects.create_user('winemaker@winery.com', 'demo123', full_name='Sofia Winemaker')

# Create demo winery
winery = Winery.objects.create(
    name='Demo Winery',
    code='DEMO',
    country='Greece',
    region='Macedonia',
    address='123 Vineyard Road'
)

# Create memberships
WineryMembership.objects.create(user=consultant, winery=winery, role='CONSULTANT')
WineryMembership.objects.create(user=owner, winery=winery, role='WINERY_OWNER')
WineryMembership.objects.create(user=winemaker, winery=winery, role='WINEMAKER')

print('Demo data recreated!')
"
```

---

## Testing Login Flow

1. Go to http://localhost:4201
2. Enter email: `consultant@winery.com`
3. Enter password: `demo123`
4. Click "Sign In"
5. You should see the Dashboard with "Demo Winery" selected

---

*Last updated: December 11, 2024*













