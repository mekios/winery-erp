# Winery ERP Design System

A comprehensive design system guide for the Winery ERP application, inspired by Purple Admin themes with a modern, clean aesthetic.

---

## Table of Contents

1. [Foundation](#foundation)
   - [Colors](#colors)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Shadows & Borders](#shadows--borders)
2. [Layout](#layout)
   - [Application Shell](#application-shell)
   - [Grid System](#grid-system)
   - [Responsive Breakpoints](#responsive-breakpoints)
3. [Components](#components)
   - [Buttons](#buttons)
   - [Cards](#cards)
   - [Tables & Data Grids](#tables--data-grids)
   - [Forms](#forms)
   - [Badges & Tags](#badges--tags)
   - [Filter Chips](#filter-chips)
   - [Icons](#icons)
4. [Patterns](#patterns)
   - [List Pages](#list-pages)
   - [Form Pages](#form-pages)
   - [Empty States](#empty-states)
   - [Loading States](#loading-states)
5. [Mobile Responsive](#mobile-responsive)
6. [Animations](#animations)

---

## Foundation

### Colors

The color system uses CSS custom properties defined in `:root` for consistency across the application.

#### Primary Purple

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#7c4dff` | Primary actions, links, active states |
| `--primary-light` | `#b47cff` | Hover states, gradients |
| `--primary-dark` | `#3f1dcb` | Focus states, dark variants |
| `--primary-gradient` | `linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)` | Primary buttons, FABs |

#### Status Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--success` | `#19d895` | Completed, positive, active |
| `--success-light` | `#e0f8ef` | Success badge backgrounds |
| `--info` | `#2196f3` | Information, in-progress |
| `--info-light` | `#e3f2fd` | Info badge backgrounds |
| `--warning` | `#ffaf00` | Pending, caution |
| `--warning-light` | `#fff8e1` | Warning badge backgrounds |
| `--danger` | `#ff6258` | Error, rejected, delete |
| `--danger-light` | `#ffebee` | Danger badge backgrounds |

#### Neutrals (Gray Scale)

| Variable | Value | Usage |
|----------|-------|-------|
| `--dark` | `#0f1015` | Darkest UI elements |
| `--gray-900` | `#1a1a2e` | Sidebar background |
| `--gray-800` | `#252545` | Sidebar hover |
| `--gray-700` | `#3d3d60` | Text primary alternative |
| `--gray-600` | `#6c7293` | Text secondary |
| `--gray-500` | `#8e94a9` | Text muted |
| `--gray-400` | `#b8bcd4` | Borders |
| `--gray-300` | `#e4e6ef` | Light borders |
| `--gray-200` | `#ebedf2` | Dividers |
| `--gray-100` | `#f4f5f7` | Backgrounds |
| `--white` | `#ffffff` | Cards, content areas |

#### Backgrounds

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-body` | `#f4f5f7` | Main page background |
| `--bg-page` | `#f9fafb` | Subtle background |
| `--bg-sidebar` | `#1a1a2e` | Sidebar gradient start |
| `--bg-card` | `#ffffff` | Card backgrounds |

#### Text Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--text-primary` | `#3d3d60` | Primary body text |
| `--text-secondary` | `#6c7293` | Secondary text, labels |
| `--text-muted` | `#8e94a9` | Hints, disabled text |
| `--text-light` | `rgba(255, 255, 255, 0.8)` | Text on dark backgrounds |

---

### Typography

**Font Family:** Nunito (Google Fonts)

```css
font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
```

#### Heading Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| `h1` | 1.875rem (30px) | 700 | 1.3 |
| `h2` | 1.5rem (24px) | 700 | 1.3 |
| `h3` | 1.25rem (20px) | 700 | 1.3 |
| `h4` | 1.125rem (18px) | 700 | 1.3 |
| `h5` | 1rem (16px) | 700 | 1.3 |
| `h6` | 0.875rem (14px) | 700 | 1.3 |

#### Body Text

| Type | Size | Weight |
|------|------|--------|
| Base | 14px | 400 |
| Small | 0.875rem (14px) | 400 |
| Extra Small | 0.75rem (12px) | 400 |
| Label | 0.875rem | 600 |
| Section Title | 0.75rem | 700, uppercase, letter-spacing: 0.05em |

#### Text Utility Classes

```css
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-lg { font-size: 1.125rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-primary { color: var(--primary); }
```

---

### Spacing

Uses a consistent 4px base unit system.

| Class | Value | px |
|-------|-------|-----|
| `.mt-1`, `.mb-1`, `.p-1` | 0.25rem | 4px |
| `.mt-2`, `.mb-2`, `.p-2` | 0.5rem | 8px |
| `.mt-3`, `.mb-3`, `.p-3` | 1rem | 16px |
| `.mt-4`, `.mb-4`, `.p-4` | 1.5rem | 24px |
| `.mt-5`, `.mb-5`, `.p-5` | 2rem | 32px |

Gap utilities:
```css
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 1rem; }
.gap-4 { gap: 1.5rem; }
```

---

### Shadows & Borders

#### Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-sm` | `0 2px 6px rgba(0, 0, 0, 0.06)` | Cards, subtle elevation |
| `--shadow` | `0 4px 12px rgba(0, 0, 0, 0.08)` | Hover states |
| `--shadow-lg` | `0 8px 24px rgba(0, 0, 0, 0.12)` | Modals, dropdowns |

#### Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--border-radius-sm` | 6px | Buttons, inputs |
| `--border-radius` | 10px | Cards, modals |
| `--border-radius-lg` | 14px | Large cards, sections |

Form sections and modern cards use `16px` radius.

#### Borders

Default border: `1px solid var(--border-color)` where `--border-color` is `#e4e6ef`.

---

## Layout

### Application Shell

The app uses a fixed sidebar with a scrollable main content area.

```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Top Header (sticky)                   │
│ (260px) ├────────────────────────────────────────│
│ fixed   │ Main Content                           │
│         │ (scrollable)                           │
│         │                                        │
└─────────────────────────────────────────────────┘
```

- **Sidebar:** 260px width, collapsible to 64px
- **Top Header:** 64px height, sticky
- **Main Content:** Flexible, scrollable

### Grid System

```css
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

Form rows use a 2-column grid by default, with `.three-col` variant for 3 columns.

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Desktop | > 991px | Full sidebar, table view |
| Tablet | 768px - 991px | Slide-in sidebar, table view |
| Mobile | < 768px | Card/list view, bottom sheets |
| Small Mobile | < 480px | Compact layouts |
| Extra Small | < 600px | Single column forms |

---

## Components

### Buttons

#### Primary Button

```css
.btn-primary {
  background: linear-gradient(135deg, #7c4dff 0%, #9d7cff 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 77, 255, 0.25);
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(124, 77, 255, 0.35);
  transform: translateY(-1px);
}
```

#### Secondary/Outline Button

```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--gray-100);
  border-color: var(--gray-300);
}
```

#### Icon Button

```css
.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}
```

#### Floating Action Button (FAB)

Used on mobile list pages for the primary "Add" action:

```css
.mobile-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(124, 77, 255, 0.4);
}
```

---

### Cards

#### Basic Card

```css
.card {
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

#### Card Sections

```css
.card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); }
.card-body { padding: 1.5rem; }
.card-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
```

#### Stat Card (Dashboard)

```html
<div class="stat-card-wrapper">
  <div class="stat-icon success">
    <mat-icon>trending_up</mat-icon>
  </div>
  <div class="stat-content">
    <div class="stat-value">1,234</div>
    <div class="stat-label">Total Items</div>
    <div class="stat-change positive">+12%</div>
  </div>
</div>
```

Icon variants: default (purple), `.success`, `.info`, `.warning`, `.danger`

---

### Tables & Data Grids

The `app-data-table` component provides a responsive data grid.

#### Desktop View

- Sticky headers with uppercase labels
- Hover row highlighting
- Action buttons appear on hover
- Material paginator

#### Mobile View (< 768px)

- Card/list layout
- Primary column as title
- Badge displayed inline
- Up to 4 metric columns shown as chips
- Compact custom pagination (prev/next buttons)

#### Column Types

| Type | Description |
|------|-------------|
| `text` | Default text display |
| `number` | Monospace font, right-aligned |
| `date` | Formatted date (MMM d) |
| `boolean` | Checkmark/dash chips |
| `badge` | Status badge with color mapping |
| `actions` | Action buttons |

---

### Forms

#### Form Section Structure

```html
<form class="form-sections">
  <section class="form-section">
    <h3 class="section-title">SECTION NAME</h3>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">Field Label</label>
        <mat-form-field appearance="outline">
          <!-- input -->
        </mat-form-field>
      </div>
    </div>
  </section>
</form>
```

#### Form Section Variants

```css
.form-section { /* Default white card */ }
.form-section.highlight { border-left: 4px solid var(--primary); }
.form-section.highlight-blue { border-left: 4px solid #3b82f6; }
.form-section.collapsible { /* Collapsible section */ }
```

#### Form Row Grid

```css
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-row.three-col {
  grid-template-columns: repeat(3, 1fr);
}
```

#### Material Form Field

Always use `appearance="outline"` for consistency:

```html
<mat-form-field appearance="outline">
  <mat-select formControlName="field">
    <mat-option [value]="option">{{ option.label }}</mat-option>
  </mat-select>
</mat-form-field>
```

---

### Badges & Tags

#### Status Badges

```css
.badge {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

| Class | Background | Text |
|-------|------------|------|
| `.badge-success`, `.badge-done` | `#e0f8ef` | `#0a8754` |
| `.badge-info`, `.badge-progress` | `#e3f2fd` | `#0d6efd` |
| `.badge-warning`, `.badge-pending` | `#fff8e1` | `#b86e00` |
| `.badge-danger`, `.badge-rejected` | `#ffebee` | `#c62828` |
| `.badge-primary` | `rgba(124, 77, 255, 0.15)` | `#7c4dff` |
| `.badge-secondary` | `#ebedf2` | `#3d3d60` |

#### Data Table Tags

```css
.tag {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.tag.green { background: rgba(16, 185, 129, 0.12); color: #059669; }
.tag.blue { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.tag.amber { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.tag.purple { background: rgba(139, 92, 246, 0.12); color: #7c3aed; }
.tag.pink { background: rgba(236, 72, 153, 0.12); color: #db2777; }
.tag.cyan { background: rgba(6, 182, 212, 0.12); color: #0891b2; }
```

---

### Filter Chips

Interactive filter buttons with dropdown menus.

```html
<app-filter-chip
  label="Status"
  [options]="statusOptions"
  [(value)]="statusFilter">
</app-filter-chip>
```

**States:**
- **Default:** White background, gray border
- **Active:** Purple gradient background, purple border
- **Compact (in toolbar):** Smaller padding, truncated values

---

### Icons

The application uses custom Lucide-based SVG icons via the `app-icon` component.

```html
<app-icon name="tank" [size]="24"></app-icon>
```

#### Available Icons

| Category | Icons |
|----------|-------|
| Navigation | `dashboard`, `settings`, `menu` |
| Equipment | `tank`, `barrel` |
| Master Data | `grape`, `farmer`, `vineyard`, `building` |
| Production | `batch`, `wine`, `transfer`, `arrow-right-left` |
| Lab | `flask`, `flask-conical` |
| Actions | `add`, `edit`, `delete`, `search`, `filter`, `check`, `x` |
| UI | `chevron-down`, `user`, `users`, `bell`, `inbox`, `eye`, `calendar` |

---

## Patterns

### List Pages

Standard structure for entity list pages:

```html
<div class="list-page">
  <!-- Header -->
  <header class="list-header">
    <div class="title-icon purple">
      <app-icon name="entity-icon" [size]="24"></app-icon>
    </div>
    <div class="header-content">
      <h1>Entity Name</h1>
      <p class="subtitle">Description text</p>
    </div>
    
    <!-- Desktop: Add button -->
    <button mat-raised-button color="primary" (click)="navigateToCreate()">
      <mat-icon>add</mat-icon>
      Add New
    </button>
  </header>
  
  <!-- Summary pills (optional) -->
  <div class="summary-pills">
    <div class="pill"><span class="pill-label">Total</span><span class="pill-value">123</span></div>
  </div>
  
  <!-- Data table -->
  <app-data-table
    [columns]="columns"
    [data]="items"
    [filterTemplate]="filtersTemplate">
  </app-data-table>
  
  <!-- Filter template -->
  <ng-template #filtersTemplate>
    <app-filter-chip label="Status" [options]="options" [(value)]="filter"></app-filter-chip>
  </ng-template>
  
  <!-- Mobile FAB -->
  <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
    <mat-icon>add</mat-icon>
  </button>
</div>
```

### Form Pages

Use the `app-form-page` wrapper component:

```html
<app-form-page
  title="Create Entity"
  subtitle="Add a new entity"
  icon="entity-icon"
  iconClass="purple"
  saveLabel="Save"
  [canSave]="form.valid"
  [saving]="saving"
  (save)="onSubmit()">
  
  <form [formGroup]="form" class="form-sections">
    <section class="form-section">
      <!-- form content -->
    </section>
  </form>
</app-form-page>
```

Icon class variants: default (purple), `green`, `amber`, `blue`, `rose`

### Empty States

```html
<div class="empty-state">
  <mat-icon>inbox</mat-icon>
  <h3>No items yet</h3>
  <p>Get started by adding your first item.</p>
  <button class="btn btn-primary">Add Item</button>
</div>
```

The data table includes an animated empty state with floating icons.

### Loading States

```html
<!-- Spinner -->
<div class="loading-container">
  <mat-spinner diameter="40"></mat-spinner>
</div>

<!-- Shimmer bar (data table) -->
<div class="loading-strip"></div>
```

---

## Mobile Responsive

### Sidebar Behavior

- **Desktop (> 991px):** Fixed sidebar, collapsible to icons
- **Mobile (≤ 991px):** Off-canvas drawer, slides from left
- Toggle via hamburger menu in header
- Close button in top-right of mobile drawer
- Overlay backdrop when open

### Data Tables

At < 768px:
- Switches from table to card/list view
- Cards show: title, badge, up to 4 metrics as chips
- Actions as vertical icon buttons
- Custom compact pagination

### Forms

At < 600px:
- Form rows become single column
- Larger touch targets (min 48px height)
- Font size 16px on inputs (prevents iOS zoom)

### Filter Drawer

Mobile filter UI pattern:
- Filter button in toolbar opens bottom sheet
- Drag handle at top
- Filters laid out vertically
- "Done" button to close

---

## Animations

### CSS Animations

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Utility Classes

```css
.fade-in { animation: fadeIn 250ms ease; }
.slide-in-up { animation: slideInUp 250ms ease; }
.animate-pulse { animation: pulse 2s infinite; }
```

### Staggered Animations

```html
<div class="stagger">
  <div>Item 1</div>  <!-- delay: 50ms -->
  <div>Item 2</div>  <!-- delay: 100ms -->
  <div>Item 3</div>  <!-- delay: 150ms -->
</div>
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition: 250ms ease;
```

Use for hover states, focus states, and UI state changes.

---

## Usage Guidelines

### Do's

- ✅ Use CSS variables for colors
- ✅ Use `appearance="outline"` for Material form fields
- ✅ Use `app-icon` for custom icons
- ✅ Use the gradient on primary actions
- ✅ Provide mobile-friendly touch targets (min 44px)
- ✅ Use responsive breakpoints consistently

### Don'ts

- ❌ Don't use raw hex colors—use variables
- ❌ Don't mix Material icon styles
- ❌ Don't use inline styles for layout
- ❌ Don't forget hover/focus states
- ❌ Don't forget mobile/touch considerations

---

## Quick Reference

### Key Colors

```scss
// Primary actions
background: linear-gradient(135deg, #7c4dff 0%, #b47cff 100%);

// Success
color: #19d895;

// Warning  
color: #ffaf00;

// Danger
color: #ff6258;
```

### Key Sizes

```scss
// Sidebar
width: 260px;        // expanded
width: 64px;         // collapsed

// Header
height: 64px;

// Border radius
border-radius: 10px;   // cards
border-radius: 16px;   // form sections
border-radius: 8px;    // buttons
border-radius: 12px;   // chips
```

### Key Shadows

```scss
// Cards
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

// Hover
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

// Buttons
box-shadow: 0 4px 12px rgba(124, 77, 255, 0.25);
```

---

*Last updated: December 2024*

