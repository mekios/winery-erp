# 🗄️ Winery ERP — Full Database Model (Markdown Version)

## 0. Conventions

- SQL dialect assumes PostgreSQL-style types.
- Every table has:
  - id (uuid or bigserial)
  - created_at, updated_at
  - winery_id (except global lookups)

## 1. Multi-Tenant Structure

### 1.1 `users`
id  
email (unique)  
password_hash  
full_name  
is_active  
created_at  
updated_at  

### 1.2 `wineries`
id  
name  
code  
country  
region  
address  
timezone  
created_at  
updated_at  

### 1.3 `winery_memberships`
id  
user_id → users  
winery_id → wineries  
role ENUM('CONSULTANT','WINERY_OWNER','WINEMAKER','CELLAR_STAFF','LAB')  
is_active  
created_at  
updated_at  

## 2. Master Data

### 2.1 `grape_varieties`
id  
winery_id  
name  
code  
color  
created_at  
updated_at  

### 2.2 `growers`
id  
winery_id  
name  
contact_info  
notes  
created_at  
updated_at  

### 2.3 `vineyard_blocks`
id  
winery_id  
grower_id  
name  
code  
region  
subregion  
area_ha  
elevation_m  
primary_variety_id  
notes  
created_at  
updated_at  

## 3. Tanks, Barrels, Equipment

### 3.1 `tanks`
id  
winery_id  
code  
name  
type  
material  
capacity_l  
location  
is_active  
notes  
created_at  
updated_at  

### 3.2 `barrels`
id  
winery_id  
code  
volume_l  
wood_type  
year  
is_active  
notes  
created_at  
updated_at  

### 3.3 `equipment`
id  
winery_id  
name  
code  
type  
location  
capacity  
notes  
created_at  
updated_at  

## 4. Harvest Intake & Batches

### 4.1 `harvest_seasons`
id  
winery_id  
year  
start_date  
end_date  
created_at  
updated_at  

### 4.2 `batches`
id  
winery_id  
batch_code  
harvest_season_id  
intake_date  
source_type  
initial_tank_id  
must_volume_l  
grape_weight_kg  
stage  
notes  
created_at  
updated_at  

### 4.3 `batch_sources`
id  
winery_id  
batch_id  
vineyard_block_id  
variety_id  
weight_kg  
is_estimated  
created_at  
updated_at  

## 5. Wine Lots

### 5.1 `wine_lots`
id  
winery_id  
code  
name  
harvest_season_id  
style  
is_blend  
notes  
created_at  
updated_at  

### 5.2 `lot_batch_links`
id  
winery_id  
wine_lot_id  
batch_id  
proportion  

## 6. Production Events — Transfers

### 6.1 `transfers`
id  
winery_id  
event_datetime  
action  
from_tank_id  
to_tank_id  
from_barrel_id  
to_barrel_id  
batch_id  
wine_lot_id  
volume_l  
temperature_c  
notes  
source_system  
source_ref  
created_by  
verified_by  
created_at  
updated_at  

## 7. Materials & Inventory

### 7.1 `materials`
id  
winery_id  
sku_code  
name  
category  
unit  
density  
supplier  
is_active  
notes  
created_at  
updated_at  

### 7.2 `material_stocks`
id  
winery_id  
material_id  
location  
current_qty  
reorder_level  
created_at  
updated_at  

### 7.3 `material_movements`
id  
winery_id  
material_id  
movement_datetime  
type  
quantity  
unit  
from_location  
to_location  
related_tank_id  
related_transfer_id  
notes  
created_by  
created_at  
updated_at  

### 7.4 `additions`
id  
winery_id  
addition_datetime  
tank_id  
barrel_id  
wine_lot_id  
batch_id  
material_id  
product_lot  
dosage_value  
dosage_unit  
total_quantity_used  
notes  
created_by  
verified_by  
created_at  
updated_at  

## 8. Analyses

### 8.1 `analyses`
id  
winery_id  
tank_id  
barrel_id  
wine_lot_id  
sample_datetime  
stage  
sample_type  
baume  
density  
brix  
residual_sugar_g_l  
temp_c  
ph  
ta_g_l  
va_g_l  
free_so2_mg_l  
total_so2_mg_l  
malic_g_l  
turbidity_ntu  
color_od  
potential_alcohol  
notes  
created_by  
created_at  
updated_at  

## 9. Tank Composition Ledger (V1 + V2)

### 9.1 `tank_ledger`
id  
winery_id  
event_id  
event_datetime  
tank_id  
delta_volume_l  
composition_key_type  
composition_key_id  
composition_key_label  
derived_source  
created_at  
updated_at  

## 10. Work Orders

### 10.1 `work_orders`
id  
winery_id  
code  
title  
description  
status  
priority  
scheduled_for  
completed_at  
created_by  
assigned_to  
created_at  
updated_at  

### 10.2 `work_order_lines`
id  
winery_id  
work_order_id  
line_no  
type  
from_tank_id  
to_tank_id  
target_tank_id  
target_barrel_id  
target_volume_l  
material_id  
dosage_value  
dosage_unit  
status  
executed_event_id  
notes  
created_at  
updated_at  

