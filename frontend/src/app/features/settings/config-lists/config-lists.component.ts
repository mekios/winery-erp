import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';

import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { 
  MasterDataService, 
  TankMaterial, TankMaterialCreate,
  WoodType, WoodTypeCreate 
} from '@features/master-data/master-data.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-config-lists',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRippleModule,
    IconComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="settings" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Configuration Lists</h1>
            <span class="subtitle">Manage tank materials, barrel wood types, and other options</span>
          </div>
        </div>
      </header>
      
      @if (!isAdmin()) {
        <div class="access-denied">
          <mat-icon>lock</mat-icon>
          <h2>Global Admin Access Required</h2>
          <p>Only global administrators can manage configuration lists.</p>
        </div>
      } @else {
        <mat-tab-group class="config-tabs" animationDuration="200ms">
          <!-- Tank Materials Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <app-icon name="tank" [size]="18"></app-icon>
              <span>Tank Materials</span>
            </ng-template>
            
            <div class="tab-content">
              <div class="tab-header">
                <h2>Tank Materials</h2>
                <p>Define the types of materials used for tanks (e.g., Stainless Steel, Concrete, Oak)</p>
              </div>
              
              @if (loadingMaterials()) {
                <app-skeleton type="table" [rows]="4"></app-skeleton>
              } @else {
                <!-- Add New Form -->
                <form [formGroup]="materialForm" (ngSubmit)="saveMaterial()" class="add-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-name">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" placeholder="e.g., Stainless Steel">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="field-code">
                      <mat-label>Code</mat-label>
                      <input matInput formControlName="code" placeholder="e.g., SS" maxlength="20">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="field-order">
                      <mat-label>Order</mat-label>
                      <input matInput type="number" formControlName="sort_order" placeholder="0">
                    </mat-form-field>
                    
                    <button type="submit" class="btn btn-primary" 
                            [disabled]="materialForm.invalid || savingMaterial()">
                      <mat-icon>{{ editingMaterialId() ? 'check' : 'add' }}</mat-icon>
                      {{ editingMaterialId() ? 'Update' : 'Add' }}
                    </button>
                    
                    @if (editingMaterialId()) {
                      <button type="button" class="btn btn-secondary" (click)="cancelEditMaterial()">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>
                </form>
                
                <!-- Materials List -->
                <div class="items-list">
                  @for (item of tankMaterials(); track item.id) {
                    <div class="list-item" [class.inactive]="!item.is_active">
                      <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-code">{{ item.code }}</span>
                      </div>
                      <div class="item-meta">
                        <span class="item-order">#{{ item.sort_order }}</span>
                        @if (!item.is_active) {
                          <span class="badge badge-muted">Inactive</span>
                        }
                      </div>
                      <div class="item-actions">
                        <button class="icon-btn" (click)="editMaterial(item)" matRipple>
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button class="icon-btn" (click)="toggleMaterialActive(item)" matRipple>
                          <mat-icon>{{ item.is_active ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                        <button class="icon-btn danger" (click)="deleteMaterial(item)" matRipple>
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-state">
                      <app-icon name="tank" [size]="32"></app-icon>
                      <p>No tank materials defined yet. Add your first one above.</p>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>
          
          <!-- Wood Types Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <app-icon name="barrel" [size]="18"></app-icon>
              <span>Wood Types</span>
            </ng-template>
            
            <div class="tab-content">
              <div class="tab-header">
                <h2>Barrel Wood Types</h2>
                <p>Define the types of wood used for barrels (e.g., French Oak, American Oak)</p>
              </div>
              
              @if (loadingWoodTypes()) {
                <app-skeleton type="table" [rows]="4"></app-skeleton>
              } @else {
                <!-- Add New Form -->
                <form [formGroup]="woodTypeForm" (ngSubmit)="saveWoodType()" class="add-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-name">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" placeholder="e.g., French Oak">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="field-code">
                      <mat-label>Code</mat-label>
                      <input matInput formControlName="code" placeholder="e.g., FO" maxlength="20">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="field-origin">
                      <mat-label>Origin Country</mat-label>
                      <input matInput formControlName="origin_country" placeholder="e.g., France">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="field-order">
                      <mat-label>Order</mat-label>
                      <input matInput type="number" formControlName="sort_order" placeholder="0">
                    </mat-form-field>
                    
                    <button type="submit" class="btn btn-primary" 
                            [disabled]="woodTypeForm.invalid || savingWoodType()">
                      <mat-icon>{{ editingWoodTypeId() ? 'check' : 'add' }}</mat-icon>
                      {{ editingWoodTypeId() ? 'Update' : 'Add' }}
                    </button>
                    
                    @if (editingWoodTypeId()) {
                      <button type="button" class="btn btn-secondary" (click)="cancelEditWoodType()">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>
                </form>
                
                <!-- Wood Types List -->
                <div class="items-list">
                  @for (item of woodTypes(); track item.id) {
                    <div class="list-item" [class.inactive]="!item.is_active">
                      <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-code">{{ item.code }}</span>
                        @if (item.origin_country) {
                          <span class="item-origin">{{ item.origin_country }}</span>
                        }
                      </div>
                      <div class="item-meta">
                        <span class="item-order">#{{ item.sort_order }}</span>
                        @if (!item.is_active) {
                          <span class="badge badge-muted">Inactive</span>
                        }
                      </div>
                      <div class="item-actions">
                        <button class="icon-btn" (click)="editWoodType(item)" matRipple>
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button class="icon-btn" (click)="toggleWoodTypeActive(item)" matRipple>
                          <mat-icon>{{ item.is_active ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                        <button class="icon-btn danger" (click)="deleteWoodType(item)" matRipple>
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-state">
                      <app-icon name="barrel" [size]="32"></app-icon>
                      <p>No wood types defined yet. Add your first one above.</p>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      height: 100%; 
    }
    
    .list-page { 
      display: flex; 
      flex-direction: column; 
      height: 100%; 
      padding: 16px 20px; 
    }
    
    .list-header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 16px; 
      gap: 16px; 
      flex-shrink: 0; 
    }
    
    .header-title { 
      display: flex; 
      align-items: center; 
      gap: 14px; 
    }
    
    .title-icon { 
      width: 44px; 
      height: 44px; 
      border-radius: 12px; 
      background: linear-gradient(135deg, #7c4dff, #b47cff); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: #fff; 
    }
    
    h1 { 
      margin: 0; 
      font-size: 22px; 
      font-weight: 700; 
    }
    
    .subtitle { 
      color: #6b7280; 
      font-size: 13px; 
    }
    
    .access-denied {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-muted);
        margin-bottom: 1rem;
      }
      
      h2 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
        font-size: 1.25rem;
      }
      
      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }
    
    .config-tabs {
      flex: 1;
      min-height: 0;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      
      ::ng-deep .mat-mdc-tab-labels {
        background: var(--gray-50);
        border-bottom: 1px solid var(--border-color);
      }
      
      ::ng-deep .mat-mdc-tab {
        padding: 0 1.5rem;
        
        .mdc-tab__content {
          gap: 0.5rem;
        }
      }
      
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      
      ::ng-deep .mat-mdc-tab-body-content {
        overflow: auto;
      }
    }
    
    .tab-content {
      padding: 1.5rem;
    }
    
    .tab-header {
      margin-bottom: 1.5rem;
      
      h2 {
        margin: 0 0 0.25rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }
    
    .add-form {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--gray-50);
      border-radius: 8px;
      border: 1px dashed var(--border-color);
    }
    
    .form-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      flex-wrap: wrap;
      
      mat-form-field {
        margin-bottom: 0;
      }
      
      .field-name { flex: 2; min-width: 150px; }
      .field-code { flex: 1; min-width: 80px; }
      .field-origin { flex: 1.5; min-width: 120px; }
      .field-order { width: 80px; flex-shrink: 0; }
      
      .btn {
        height: 56px;
        flex-shrink: 0;
      }
    }
    
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .list-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      transition: all 0.15s ease;
      
      &:hover {
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      
      &.inactive {
        opacity: 0.6;
        background: var(--gray-50);
      }
    }
    
    .item-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    
    .item-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .item-code {
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--gray-100);
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    
    .item-origin {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    
    .item-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .item-order {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    .item-actions {
      display: flex;
      gap: 0.25rem;
    }
    
    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-muted);
      }
      
      &:hover {
        background: var(--gray-100);
        
        mat-icon {
          color: var(--text-primary);
        }
      }
      
      &.danger:hover {
        background: var(--danger-light);
        
        mat-icon {
          color: var(--danger);
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      
      app-icon {
        margin-bottom: 0.75rem;
        opacity: 0.5;
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    .badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge-muted {
      background: var(--gray-200);
      color: var(--text-muted);
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      height: 40px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #7c4dff 0%, #9d7cff 100%);
      color: white;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(124, 77, 255, 0.3);
      }
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      
      &:hover:not(:disabled) {
        background: var(--gray-100);
        border-color: var(--gray-300);
      }
    }
    
    @media (max-width: 768px) {
      .config-lists-page {
        padding: 1rem;
      }
      
      .form-row {
        flex-direction: column;
        
        mat-form-field, .btn {
          width: 100%;
          flex: none;
        }
        
        .field-order {
          width: 100%;
        }
      }
      
      .list-item {
        flex-wrap: wrap;
      }
      
      .item-info {
        flex-basis: 100%;
        flex-wrap: wrap;
      }
      
      .item-meta {
        flex: 1;
      }
    }
  `]
})
export class ConfigListsComponent implements OnInit {
  private masterDataService = inject(MasterDataService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  
  // Tank Materials
  tankMaterials = signal<TankMaterial[]>([]);
  loadingMaterials = signal(true);
  savingMaterial = signal(false);
  editingMaterialId = signal<string | null>(null);
  
  materialForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    sort_order: [0]
  });
  
  // Wood Types
  woodTypes = signal<WoodType[]>([]);
  loadingWoodTypes = signal(true);
  savingWoodType = signal(false);
  editingWoodTypeId = signal<string | null>(null);
  
  woodTypeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    origin_country: [''],
    sort_order: [0]
  });
  
  ngOnInit(): void {
    this.loadMaterials();
    this.loadWoodTypes();
  }
  
  isAdmin(): boolean {
    return this.authService.currentUser()?.is_superuser ?? false;
  }
  
  // ===============================
  // Tank Materials
  // ===============================
  
  loadMaterials(): void {
    this.loadingMaterials.set(true);
    this.masterDataService.getTankMaterials({ page_size: 100 }).subscribe({
      next: (r) => {
        this.tankMaterials.set(r.results);
        this.loadingMaterials.set(false);
      },
      error: () => {
        this.loadingMaterials.set(false);
        this.snackBar.open('Failed to load tank materials', 'Close', { duration: 3000 });
      }
    });
  }
  
  saveMaterial(): void {
    if (this.materialForm.invalid) return;
    
    this.savingMaterial.set(true);
    const data: TankMaterialCreate = this.materialForm.value;
    
    const obs = this.editingMaterialId()
      ? this.masterDataService.updateTankMaterial(this.editingMaterialId()!, data)
      : this.masterDataService.createTankMaterial(data);
    
    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.editingMaterialId() ? 'Material updated' : 'Material added', 
          'Close', 
          { duration: 2000 }
        );
        this.materialForm.reset({ sort_order: 0 });
        this.editingMaterialId.set(null);
        this.savingMaterial.set(false);
        this.loadMaterials();
      },
      error: () => {
        this.savingMaterial.set(false);
        this.snackBar.open('Failed to save material', 'Close', { duration: 3000 });
      }
    });
  }
  
  editMaterial(item: TankMaterial): void {
    this.editingMaterialId.set(item.id);
    this.materialForm.patchValue({
      name: item.name,
      code: item.code,
      sort_order: item.sort_order
    });
  }
  
  cancelEditMaterial(): void {
    this.editingMaterialId.set(null);
    this.materialForm.reset({ sort_order: 0 });
  }
  
  toggleMaterialActive(item: TankMaterial): void {
    this.masterDataService.updateTankMaterial(item.id, { is_active: !item.is_active }).subscribe({
      next: () => {
        this.loadMaterials();
        this.snackBar.open(
          item.is_active ? 'Material deactivated' : 'Material activated', 
          'Close', 
          { duration: 2000 }
        );
      },
      error: () => {
        this.snackBar.open('Failed to update material', 'Close', { duration: 3000 });
      }
    });
  }
  
  deleteMaterial(item: TankMaterial): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tank Material',
        message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete'
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.masterDataService.deleteTankMaterial(item.id).subscribe({
          next: () => {
            this.loadMaterials();
            this.snackBar.open('Material deleted', 'Close', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Failed to delete material', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  
  // ===============================
  // Wood Types
  // ===============================
  
  loadWoodTypes(): void {
    this.loadingWoodTypes.set(true);
    this.masterDataService.getWoodTypes({ page_size: 100 }).subscribe({
      next: (r) => {
        this.woodTypes.set(r.results);
        this.loadingWoodTypes.set(false);
      },
      error: () => {
        this.loadingWoodTypes.set(false);
        this.snackBar.open('Failed to load wood types', 'Close', { duration: 3000 });
      }
    });
  }
  
  saveWoodType(): void {
    if (this.woodTypeForm.invalid) return;
    
    this.savingWoodType.set(true);
    const data: WoodTypeCreate = this.woodTypeForm.value;
    
    const obs = this.editingWoodTypeId()
      ? this.masterDataService.updateWoodType(this.editingWoodTypeId()!, data)
      : this.masterDataService.createWoodType(data);
    
    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.editingWoodTypeId() ? 'Wood type updated' : 'Wood type added', 
          'Close', 
          { duration: 2000 }
        );
        this.woodTypeForm.reset({ sort_order: 0 });
        this.editingWoodTypeId.set(null);
        this.savingWoodType.set(false);
        this.loadWoodTypes();
      },
      error: () => {
        this.savingWoodType.set(false);
        this.snackBar.open('Failed to save wood type', 'Close', { duration: 3000 });
      }
    });
  }
  
  editWoodType(item: WoodType): void {
    this.editingWoodTypeId.set(item.id);
    this.woodTypeForm.patchValue({
      name: item.name,
      code: item.code,
      origin_country: item.origin_country,
      sort_order: item.sort_order
    });
  }
  
  cancelEditWoodType(): void {
    this.editingWoodTypeId.set(null);
    this.woodTypeForm.reset({ sort_order: 0 });
  }
  
  toggleWoodTypeActive(item: WoodType): void {
    this.masterDataService.updateWoodType(item.id, { is_active: !item.is_active }).subscribe({
      next: () => {
        this.loadWoodTypes();
        this.snackBar.open(
          item.is_active ? 'Wood type deactivated' : 'Wood type activated', 
          'Close', 
          { duration: 2000 }
        );
      },
      error: () => {
        this.snackBar.open('Failed to update wood type', 'Close', { duration: 3000 });
      }
    });
  }
  
  deleteWoodType(item: WoodType): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Wood Type',
        message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete'
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.masterDataService.deleteWoodType(item.id).subscribe({
          next: () => {
            this.loadWoodTypes();
            this.snackBar.open('Wood type deleted', 'Close', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Failed to delete wood type', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}

