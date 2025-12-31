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
      
      <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./seasons-list.component.scss']
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
  
  formatWeight(kg: number | null | undefined): string {
    if (kg === null || kg === undefined || kg === 0) {
      return '0kg';
    }
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg.toFixed(0)}kg`;
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



