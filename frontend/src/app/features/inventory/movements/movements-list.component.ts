import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';

import { IconComponent } from '@shared/components/icon/icon.component';
import { InventoryService, MaterialMovement } from '../inventory.service';
import { MovementFormDialogComponent } from './movement-form-dialog.component';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    IconComponent,
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="truck" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Stock Movements</h1>
            <span class="subtitle">Track inventory purchases, adjustments, and usage</span>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openMovementDialog()">
            <mat-icon>add</mat-icon>
            Record Movement
          </button>
        </div>
      </header>
      
      <main class="list-content">
        @if (loading()) {
          <div class="loading-state">
            <mat-icon class="loading-icon">hourglass_empty</mat-icon>
            <p>Loading movements...</p>
          </div>
        } @else if (movements().length === 0) {
          <div class="empty-state">
            <app-icon name="truck" [size]="48"></app-icon>
            <h3>No Stock Movements</h3>
            <p>Record purchases, adjustments, or transfers to track inventory</p>
            <button class="btn btn-primary" (click)="openMovementDialog()">
              <mat-icon>add</mat-icon>
              Record Movement
            </button>
          </div>
        } @else {
          <div class="movements-list">
            @for (movement of movements(); track movement.id) {
              <div class="movement-card">
                <div class="movement-header">
                  <div class="movement-info">
                    <mat-chip [ngClass]="getMovementTypeClass(movement.movement_type)">
                      {{ movement.movement_type_display }}
                    </mat-chip>
                    <h3 class="material-name">{{ movement.material_name }}</h3>
                  </div>
                  <div class="movement-quantity" [ngClass]="getQuantityClass(movement)">
                    {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity | number:'1.0-2' }} {{ movement.unit_display }}
                  </div>
                </div>

                <div class="movement-details">
                  <div class="detail-row">
                    <span class="label">Location:</span>
                    <span class="value">{{ movement.location_display }}</span>
                  </div>

                  @if (movement.destination_location_display) {
                    <div class="detail-row">
                      <span class="label">Destination:</span>
                      <span class="value">{{ movement.destination_location_display }}</span>
                    </div>
                  }

                  @if (movement.reference_number) {
                    <div class="detail-row">
                      <span class="label">Reference:</span>
                      <span class="value">{{ movement.reference_number }}</span>
                    </div>
                  }

                  @if (movement.unit_cost) {
                    <div class="detail-row">
                      <span class="label">Unit Cost:</span>
                      <span class="value">€{{ movement.unit_cost | number:'1.2-2' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Total Cost:</span>
                      <span class="value total-cost">€{{ (movement.unit_cost * movement.quantity) | number:'1.2-2' }}</span>
                    </div>
                  }

                  <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">{{ movement.movement_date | date:'medium' }}</span>
                  </div>

                  @if (movement.notes) {
                    <div class="detail-row notes">
                      <span class="label">Notes:</span>
                      <span class="value">{{ movement.notes }}</span>
                    </div>
                  }

                  @if (movement.created_by_name) {
                    <div class="detail-row meta">
                      <span class="label">Recorded by:</span>
                      <span class="value">{{ movement.created_by_name }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styleUrls: ['./movements-list.component.scss']
})
export class MovementsListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);

  movements = signal<MaterialMovement[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);

    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading movements:', err);
        this.loading.set(false);
      },
    });
  }

  openMovementDialog(): void {
    const dialogRef = this.dialog.open(MovementFormDialogComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMovements();
      }
    });
  }

  getMovementTypeClass(type: string): string {
    switch (type) {
      case 'PURCHASE':
        return 'type-purchase';
      case 'ADJUSTMENT':
        return 'type-adjustment';
      case 'TRANSFER':
        return 'type-transfer';
      case 'USAGE':
        return 'type-usage';
      case 'WASTE':
        return 'type-waste';
      case 'RETURN':
        return 'type-return';
      default:
        return '';
    }
  }

  getQuantityClass(movement: MaterialMovement): string {
    const positiveTypes = ['PURCHASE', 'ADJUSTMENT', 'TRANSFER'];
    if (positiveTypes.includes(movement.movement_type)) {
      return 'quantity-positive';
    }
    return 'quantity-negative';
  }
}
