import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { IconComponent } from '@shared/components/icon/icon.component';
import { InventoryService, Addition } from '../inventory.service';

@Component({
  selector: 'app-additions-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    MatIconModule,
    IconComponent,
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="flask" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Material Additions</h1>
            <span class="subtitle">Track materials added to tanks, barrels, and batches</span>
          </div>
        </div>
      </header>
      
      <main class="list-content">
        @if (loading()) {
          <div class="loading-state">
            <mat-icon class="loading-icon">hourglass_empty</mat-icon>
            <p>Loading additions...</p>
          </div>
        } @else if (additions().length === 0) {
          <div class="empty-state">
            <app-icon name="flask" [size]="48"></app-icon>
            <h3>No Additions Recorded</h3>
            <p>Material additions are created when you add SO₂, yeast, or other materials to tanks or barrels from their detail pages.</p>
          </div>
        } @else {
          <div class="additions-list">
            @for (addition of additions(); track addition.id) {
              <div class="addition-card">
                <div class="addition-header">
                  <div class="addition-info">
                    <h3 class="material-name">{{ addition.material_name }}</h3>
                    <div class="category-badge">{{ addition.material_category_display }}</div>
                  </div>
                  <div class="addition-quantity">
                    {{ addition.quantity | number:'1.0-2' }} {{ addition.unit_display }}
                  </div>
                </div>

                <div class="addition-details">
                  <div class="detail-row">
                    <span class="label">Target:</span>
                    <span class="value target">{{ addition.target_display }}</span>
                  </div>

                  @if (addition.purpose) {
                    <div class="detail-row">
                      <span class="label">Purpose:</span>
                      <span class="value">{{ addition.purpose }}</span>
                    </div>
                  }

                  @if (addition.dosage_rate) {
                    <div class="detail-row">
                      <span class="label">Dosage Rate:</span>
                      <span class="value dosage">{{ addition.dosage_rate }}</span>
                    </div>
                  }

                  @if (addition.target_volume_l) {
                    <div class="detail-row">
                      <span class="label">Target Volume:</span>
                      <span class="value">{{ addition.target_volume_l | number:'1.0-0' }} L</span>
                    </div>
                  }

                  <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">{{ addition.addition_date | date:'medium' }}</span>
                  </div>

                  @if (addition.notes) {
                    <div class="detail-row notes">
                      <span class="label">Notes:</span>
                      <span class="value">{{ addition.notes }}</span>
                    </div>
                  }

                  @if (addition.added_by_name) {
                    <div class="detail-row meta">
                      <span class="label">Added by:</span>
                      <span class="value">{{ addition.added_by_name }}</span>
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
  styleUrls: ['./additions-list.component.scss']
})
export class AdditionsListComponent implements OnInit {
  private inventoryService = inject(InventoryService);

  additions = signal<Addition[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadAdditions();
  }

  loadAdditions(): void {
    this.loading.set(true);

    this.inventoryService.getAdditions().subscribe({
      next: (data) => {
        this.additions.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading additions:', err);
        this.loading.set(false);
      },
    });
  }
}
