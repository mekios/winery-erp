import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { InventoryService, Addition } from '../inventory.service';

@Component({
  selector: 'app-additions-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    PageHeaderComponent,
    IconComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './additions-list.component.html',
  styleUrl: './additions-list.component.scss'
})
export class AdditionsListComponent implements OnInit {
  additions = signal<Addition[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadAdditions();
  }

  loadAdditions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inventoryService.getAdditions().subscribe({
      next: (data) => {
        this.additions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading additions:', err);
        this.error.set('Failed to load additions');
        this.loading.set(false);
      },
    });
  }
}

