import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { HarvestService, HarvestSeason } from '../harvest.service';

@Component({
  selector: 'app-seasons-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    IconComponent,
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="calendar" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Harvest Seasons</h1>
            <span class="subtitle">Manage vintages</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Season
        </button>
      </header>
      
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (seasons().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <div class="empty-icon-wrap">
              <app-icon name="calendar" [size]="48"></app-icon>
            </div>
            <h2>No Harvest Seasons</h2>
            <p>Create a harvest season to start tracking batches.</p>
            <button mat-raised-button color="primary" (click)="navigateToCreate()">
              <mat-icon>add</mat-icon>
              Create Season
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="seasons-grid">
          @for (season of seasons(); track season.id) {
            <mat-card class="season-card" [class.active]="season.is_active">
              <mat-card-header>
                <div class="season-header">
                  <div class="season-info">
                    <span class="season-year">{{ season.year }}</span>
                    <h3>{{ season.name }}</h3>
                    @if (season.is_active) {
                      <mat-chip class="active-chip">Active</mat-chip>
                    }
                  </div>
                  <div class="season-actions">
                    <button mat-icon-button (click)="navigateToEdit(season)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="confirmDelete(season)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <div class="season-stats">
                  <div class="stat">
                    <span class="stat-value">{{ season.batch_count }}</span>
                    <span class="stat-label">Batches</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ formatWeight(season.total_grape_weight_kg) }}</span>
                    <span class="stat-label">Total Weight</span>
                  </div>
                </div>
                
                @if (season.start_date || season.end_date) {
                  <div class="season-dates">
                    <mat-icon>date_range</mat-icon>
                    <span>
                      {{ season.start_date | date:'mediumDate' }}
                      @if (season.end_date) {
                        — {{ season.end_date | date:'mediumDate' }}
                      }
                    </span>
                  </div>
                }
              </mat-card-content>
              
              <mat-card-actions>
                <a mat-button color="primary" 
                   [routerLink]="['/harvest/batches']" 
                   [queryParams]="{season: season.id}">
                  View Batches
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .list-page { padding: 16px 20px; }
    .list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
    .header-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7c4dff, #b47cff); display: flex; align-items: center; justify-content: center; color: #fff; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 13px; }
    .loading-container { display: flex; justify-content: center; padding: 3rem; }
    
    .empty-card {
      mat-card-content {
        display: flex; flex-direction: column; align-items: center;
        padding: 3rem !important; text-align: center;
      }
      .empty-icon-wrap { color: var(--gray-400); margin-bottom: 1rem; }
      h2 { margin: 0 0 0.5rem; }
      p { margin: 0 0 1.5rem; color: var(--text-secondary); }
    }
    
    .seasons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .season-card {
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
      
      &.active {
        border-left: 4px solid var(--primary);
      }
      
      .season-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        width: 100%; padding: 1rem;
      }
      
      .season-info {
        display: flex; flex-direction: column; gap: 0.25rem;
      }
      
      .season-year {
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
        color: var(--primary); letter-spacing: 0.5px;
      }
      
      h3 { margin: 0; font-size: 1.25rem; }
      
      .active-chip {
        margin-top: 0.5rem;
        background: var(--success) !important;
        color: white !important;
        font-size: 0.7rem;
      }
      
      .season-actions {
        display: flex; gap: 0.25rem;
      }
      
      mat-card-content { padding: 0 1rem 1rem !important; }
      
      .season-stats {
        display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        padding: 1rem; background: var(--gray-100); border-radius: 8px;
        margin-bottom: 1rem;
      }
      
      .stat {
        display: flex; flex-direction: column; align-items: center;
        
        .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
        .stat-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
      }
      
      .season-dates {
        display: flex; align-items: center; gap: 0.5rem;
        font-size: 0.875rem; color: var(--text-secondary);
        mat-icon { font-size: 1.25rem; width: 1.25rem; height: 1.25rem; }
      }
      
      mat-card-actions { padding: 0.5rem 1rem 1rem !important; }
    }
  `]
})
export class SeasonsListComponent implements OnInit {
  private harvestService = inject(HarvestService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  seasons = signal<HarvestSeason[]>([]);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadSeasons();
  }
  
  loadSeasons(): void {
    this.loading.set(true);
    this.harvestService.getSeasons().subscribe({
      next: (response) => {
        this.seasons.set(response.results);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load seasons', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
  
  formatWeight(kg: number): string {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg}kg`;
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/harvest/seasons/new']);
  }
  
  navigateToEdit(season: HarvestSeason): void {
    this.router.navigate(['/harvest/seasons', season.id, 'edit']);
  }
  
  confirmDelete(season: HarvestSeason): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Season',
        message: `Delete "${season.name}"? This will also delete all batches in this season.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete',
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.harvestService.deleteSeason(season.id).subscribe({
          next: () => {
            this.snackBar.open('Season deleted', 'Close', { duration: 3000 });
            this.loadSeasons();
          },
          error: () => {
            this.snackBar.open('Failed to delete season', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}



