import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { InventoryService, MaterialMovement } from '../inventory.service';
import { MovementFormDialogComponent } from './movement-form-dialog.component';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatChipsModule,
    PageHeaderComponent,
    IconComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './movements-list.component.html',
  styleUrl: './movements-list.component.scss'
})
export class MovementsListComponent implements OnInit {
  movements = signal<MaterialMovement[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading movements:', err);
        this.error.set('Failed to load stock movements');
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

