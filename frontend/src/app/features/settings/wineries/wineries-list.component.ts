import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { WineriesAdminService, Winery, WineryMember, ROLE_LABELS } from './wineries-admin.service';
import { WineryDialogComponent, WineryDialogData } from './winery-dialog.component';
import { AddMemberDialogComponent, AddMemberDialogData } from './add-member-dialog.component';

@Component({
  selector: 'app-wineries-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Winery Management</h1>
          <p class="page-subtitle">Create and manage wineries and their members</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Create Winery
        </button>
      </div>
      
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (wineries().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <mat-icon>business</mat-icon>
            <h2>No Wineries Yet</h2>
            <p>Create your first winery to get started.</p>
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Create Winery
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="wineries-grid">
          @for (winery of wineries(); track winery.id) {
            <mat-card class="winery-card">
              <mat-card-header>
                <div class="winery-header">
                  <div class="winery-info">
                    <span class="winery-code">{{ winery.code }}</span>
                    <h3>{{ winery.name }}</h3>
                    <span class="winery-location">{{ winery.region }}, {{ winery.country }}</span>
                  </div>
                  <button mat-icon-button [matMenuTriggerFor]="wineryMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #wineryMenu="matMenu">
                    <button mat-menu-item (click)="openEditDialog(winery)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Winery</span>
                    </button>
                    <button mat-menu-item (click)="confirmDeleteWinery(winery)">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete Winery</span>
                    </button>
                  </mat-menu>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <mat-expansion-panel class="members-panel">
                  <mat-expansion-panel-header (click)="loadMembers(winery)">
                    <mat-panel-title>
                      <mat-icon>people</mat-icon>
                      Members ({{ winery.member_count }})
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="members-content">
                    @if (loadingMembers()[winery.id]) {
                      <div class="members-loading">
                        <mat-spinner diameter="24"></mat-spinner>
                      </div>
                    } @else {
                      <mat-list>
                        @for (member of membersMap()[winery.id] || []; track member.id) {
                          <mat-list-item>
                            <div class="member-item">
                              <div class="member-info">
                                <span class="member-name">{{ member.user_name || member.user_email }}</span>
                                <span class="member-email">{{ member.user_email }}</span>
                              </div>
                              <mat-chip [class]="'role-chip role-' + member.role.toLowerCase()">
                                {{ getRoleLabel(member.role) }}
                              </mat-chip>
                              <button mat-icon-button 
                                      matTooltip="Remove member"
                                      (click)="confirmRemoveMember(winery, member)">
                                <mat-icon>remove_circle_outline</mat-icon>
                              </button>
                            </div>
                          </mat-list-item>
                        } @empty {
                          <mat-list-item>
                            <span class="no-members">No members found</span>
                          </mat-list-item>
                        }
                      </mat-list>
                      
                      <button mat-stroked-button color="primary" 
                              class="add-member-btn"
                              (click)="openAddMemberDialog(winery)">
                        <mat-icon>person_add</mat-icon>
                        Add Member
                      </button>
                    }
                  </div>
                </mat-expansion-panel>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 1.5rem;
      h1 { margin: 0; }
      .page-subtitle { margin: 0.25rem 0 0; color: var(--text-secondary); }
    }
    .loading-container { display: flex; justify-content: center; padding: 3rem; }
    
    .empty-card {
      mat-card-content {
        display: flex; flex-direction: column; align-items: center;
        padding: 3rem !important; text-align: center;
      }
      mat-icon { font-size: 4rem; width: 4rem; height: 4rem; color: var(--gray-400); margin-bottom: 1rem; }
      h2 { margin: 0 0 0.5rem; color: var(--text-primary); }
      p { margin: 0 0 1.5rem; color: var(--text-secondary); }
    }
    
    .wineries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    
    .winery-card {
      .winery-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        width: 100%; padding: 1rem 1rem 0;
      }
      .winery-info {
        display: flex; flex-direction: column; gap: 0.25rem;
      }
      .winery-code {
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
        color: var(--primary); letter-spacing: 0.5px;
      }
      h3 { margin: 0; font-size: 1.25rem; }
      .winery-location { font-size: 0.875rem; color: var(--text-secondary); }
      
      mat-card-content { padding: 0 !important; }
    }
    
    .members-panel {
      box-shadow: none !important;
      background: transparent !important;
      
      mat-panel-title {
        display: flex; align-items: center; gap: 0.5rem;
        mat-icon { font-size: 1.25rem; width: 1.25rem; height: 1.25rem; }
      }
    }
    
    .members-content {
      padding: 0.5rem 0;
    }
    
    .members-loading {
      display: flex; justify-content: center; padding: 1rem;
    }
    
    .member-item {
      display: flex; align-items: center; gap: 0.75rem; width: 100%;
      .member-info {
        flex: 1; display: flex; flex-direction: column;
        .member-name { font-weight: 500; }
        .member-email { font-size: 0.8rem; color: var(--text-secondary); }
      }
    }
    
    .role-chip {
      font-size: 0.7rem !important; font-weight: 600;
      &.role-consultant { background: var(--primary-light) !important; color: white !important; }
      &.role-winery_owner { background: var(--success) !important; color: white !important; }
      &.role-winemaker { background: var(--info) !important; color: white !important; }
      &.role-cellar_staff { background: var(--warning) !important; color: var(--dark) !important; }
      &.role-lab { background: var(--gray-500) !important; color: white !important; }
    }
    
    .no-members { color: var(--text-muted); font-style: italic; }
    
    .add-member-btn {
      margin: 0.5rem 1rem 1rem;
    }
  `]
})
export class WineriesListComponent implements OnInit {
  private wineriesService = inject(WineriesAdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  wineries = signal<Winery[]>([]);
  loading = signal(true);
  membersMap = signal<Record<string, WineryMember[]>>({});
  loadingMembers = signal<Record<string, boolean>>({});
  
  ngOnInit(): void {
    this.loadWineries();
  }
  
  loadWineries(): void {
    this.loading.set(true);
    this.wineriesService.getWineries().subscribe({
      next: (response) => {
        this.wineries.set(response.results);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load wineries', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
  
  loadMembers(winery: Winery): void {
    // Skip if already loaded
    if (this.membersMap()[winery.id]) return;
    
    this.loadingMembers.update(m => ({ ...m, [winery.id]: true }));
    
    this.wineriesService.getWineryMembers(winery.id).subscribe({
      next: (members) => {
        this.membersMap.update(m => ({ ...m, [winery.id]: members }));
        this.loadingMembers.update(m => ({ ...m, [winery.id]: false }));
      },
      error: () => {
        this.loadingMembers.update(m => ({ ...m, [winery.id]: false }));
        this.snackBar.open('Failed to load members', 'Close', { duration: 3000 });
      }
    });
  }
  
  getRoleLabel(role: string): string {
    return ROLE_LABELS[role] || role;
  }
  
  openCreateDialog(): void {
    const ref = this.dialog.open(WineryDialogComponent, {
      data: { mode: 'create' } as WineryDialogData,
      width: '550px',
    });
    
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.wineriesService.createWinery(result).subscribe({
          next: (winery) => {
            this.snackBar.open(`Winery "${winery.name}" created successfully!`, 'Close', { duration: 3000 });
            this.loadWineries();
          },
          error: (err) => {
            const msg = err.error?.code?.[0] || err.error?.name?.[0] || 'Failed to create winery';
            this.snackBar.open(msg, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  
  openEditDialog(winery: Winery): void {
    const ref = this.dialog.open(WineryDialogComponent, {
      data: { mode: 'edit', winery } as WineryDialogData,
      width: '550px',
    });
    
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.wineriesService.updateWinery(winery.id, result).subscribe({
          next: () => {
            this.snackBar.open('Winery updated successfully', 'Close', { duration: 3000 });
            this.loadWineries();
          },
          error: () => {
            this.snackBar.open('Failed to update winery', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  
  confirmDeleteWinery(winery: Winery): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Winery',
        message: `Are you sure you want to delete "${winery.name}"? This will remove all members and cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete',
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.wineriesService.deleteWinery(winery.id).subscribe({
          next: () => {
            this.snackBar.open('Winery deleted', 'Close', { duration: 3000 });
            this.loadWineries();
          },
          error: () => {
            this.snackBar.open('Failed to delete winery', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  
  openAddMemberDialog(winery: Winery): void {
    const ref = this.dialog.open(AddMemberDialogComponent, {
      data: { winery } as AddMemberDialogData,
      width: '450px',
    });
    
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.wineriesService.addMember(result).subscribe({
          next: () => {
            this.snackBar.open('Member added successfully', 'Close', { duration: 3000 });
            // Clear cache to reload members
            this.membersMap.update(m => {
              const updated = { ...m };
              delete updated[winery.id];
              return updated;
            });
            this.loadMembers(winery);
            // Update member count
            this.loadWineries();
          },
          error: (err) => {
            const msg = err.error?.user_email?.[0] || err.error?.detail || 'Failed to add member';
            this.snackBar.open(msg, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  
  confirmRemoveMember(winery: Winery, member: WineryMember): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Member',
        message: `Remove ${member.user_name || member.user_email} from ${winery.name}?`,
        confirmText: 'Remove',
        confirmColor: 'warn',
        icon: 'person_remove',
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.wineriesService.removeMember(member.id).subscribe({
          next: () => {
            this.snackBar.open('Member removed', 'Close', { duration: 3000 });
            // Clear cache to reload
            this.membersMap.update(m => {
              const updated = { ...m };
              delete updated[winery.id];
              return updated;
            });
            this.loadMembers(winery);
            this.loadWineries();
          },
          error: () => {
            this.snackBar.open('Failed to remove member', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}




