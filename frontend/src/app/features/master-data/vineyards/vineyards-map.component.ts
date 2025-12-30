import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMap, MapMarker, MapInfoWindow, GoogleMapsModule } from '@angular/google-maps';
import { MasterDataService, VineyardBlockDropdown } from '../master-data.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-vineyards-map',
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleMapsModule, MatButtonModule, MatIconModule, IconComponent],
  template: `
    <div class="map-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon amber">
            <app-icon name="vineyard" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Vineyard Map</h1>
            <span class="subtitle">View all vineyard locations</span>
          </div>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/master-data/vineyards">
            <app-icon name="list" [size]="18"></app-icon>
            List View
          </a>
          <button mat-raised-button color="primary" routerLink="/master-data/vineyards/new">
            <mat-icon>add</mat-icon>
            Add Vineyard
          </button>
        </div>
      </header>
      
      <div class="map-content">
        @if (loading()) {
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Loading vineyards...</span>
          </div>
        }
        
        <google-map
          [height]="'100%'"
          [width]="'100%'"
          [center]="mapCenter"
          [zoom]="mapZoom"
          [options]="mapOptions">
          
          @for (vineyard of vineyardsWithCoords(); track vineyard.id) {
            <map-marker
              [position]="{ lat: vineyard.latitude!, lng: vineyard.longitude! }"
              [title]="vineyard.display_name"
              [options]="markerOptions"
              (mapClick)="onMarkerClick(vineyard)">
            </map-marker>
          }
        </google-map>
        
        <div class="map-legend">
          <div class="legend-header">
            <app-icon name="vineyard" [size]="16"></app-icon>
            <span>{{ vineyardsWithCoords().length }} Vineyards</span>
          </div>
          @if (vineyardsWithoutCoords().length > 0) {
            <div class="legend-warning">
              <app-icon name="alert" [size]="14"></app-icon>
              <span>{{ vineyardsWithoutCoords().length }} without location</span>
            </div>
          }
        </div>
        
        @if (selectedVineyard()) {
          <div class="vineyard-popup">
            <button class="close-btn" (click)="selectedVineyard.set(null)">×</button>
            <h3>{{ selectedVineyard()!.display_name }}</h3>
            <div class="popup-details">
              @if (selectedVineyard()!.region) {
                <div class="detail-row">
                  <span class="label">Region</span>
                  <span class="value">{{ selectedVineyard()!.region }}</span>
                </div>
              }
              @if (selectedVineyard()!.area_acres) {
                <div class="detail-row">
                  <span class="label">Area</span>
                  <span class="value">{{ selectedVineyard()!.area_acres }} acres</span>
                </div>
              }
              @if (selectedVineyard()!.varieties_summary) {
                <div class="detail-row">
                  <span class="label">Varieties</span>
                  <span class="value">{{ selectedVineyard()!.varieties_summary }}</span>
                </div>
              }
            </div>
            <a [routerLink]="['/master-data/vineyards', selectedVineyard()!.id, 'edit']" mat-raised-button color="primary">
              <app-icon name="edit" [size]="14"></app-icon>
              Edit Vineyard
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    
    .map-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px 20px;
    }
    
    /* Use same header styles as list page */
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 16px;
      flex-shrink: 0;
      flex-wrap: wrap;
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
      
      &.amber {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
        color: #d97706;
      }
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
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .map-content {
      flex: 1;
      position: relative;
      min-height: 0;
    }
    
    google-map {
      position: absolute;
      inset: 0;
      display: block;
    }
    
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      z-index: 1000;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--gray-200);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .map-legend {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      background: var(--bg-card);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .legend-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
    
    .legend-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #d97706;
    }
    
    .vineyard-popup {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: var(--bg-card);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 500;
      min-width: 280px;
      max-width: 320px;
    }
    
    .vineyard-popup h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      padding-right: 1.5rem;
    }
    
    .close-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      
      &:hover {
        background: var(--gray-100);
        color: var(--text-primary);
      }
    }
    
    .popup-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      
      .label {
        color: var(--text-secondary);
      }
      
      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    @media (max-width: 600px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .vineyard-popup {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `]
})
export class VineyardsMapComponent implements OnInit {
  private masterDataService = inject(MasterDataService);
  private router = inject(Router);
  
  loading = signal(true);
  vineyards = signal<VineyardBlockDropdown[]>([]);
  selectedVineyard = signal<VineyardBlockDropdown | null>(null);
  
  vineyardsWithCoords = () => this.vineyards().filter(v => v.latitude && v.longitude);
  vineyardsWithoutCoords = () => this.vineyards().filter(v => !v.latitude || !v.longitude);
  
  mapCenter: google.maps.LatLngLiteral = { lat: 38.5, lng: 23.5 }; // Greece center
  mapZoom = 7;
  
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'greedy',
  };
  
  markerOptions: google.maps.MarkerOptions = {
    animation: google.maps.Animation.DROP,
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="20" cy="50" rx="8" ry="2" fill="black" opacity="0.2"/>
          
          <!-- Main pin body with gradient -->
          <defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#7c4dff;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#b47cff;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Pin shape -->
          <path d="M20 0C11.716 0 5 6.716 5 15c0 11.25 15 27 15 27s15-15.75 15-27c0-8.284-6.716-15-15-15z" 
                fill="url(#pinGradient)" stroke="#5a35b8" stroke-width="1.5"/>
          
          <!-- White circle background for icon -->
          <circle cx="20" cy="15" r="8" fill="white"/>
          
          <!-- Grape icon (simplified grape cluster) -->
          <g transform="translate(20, 15)">
            <!-- Top grape -->
            <circle cx="0" cy="-3" r="2.2" fill="#7c4dff"/>
            <!-- Left grape -->
            <circle cx="-2.5" cy="0" r="2.2" fill="#7c4dff"/>
            <!-- Right grape -->
            <circle cx="2.5" cy="0" r="2.2" fill="#7c4dff"/>
            <!-- Bottom left grape -->
            <circle cx="-2" cy="3" r="2.2" fill="#8f5fff"/>
            <!-- Bottom right grape -->
            <circle cx="2" cy="3" r="2.2" fill="#8f5fff"/>
            <!-- Stem -->
            <path d="M 0,-5 Q 1,-7 2,-8" stroke="#4caf50" stroke-width="1" fill="none" stroke-linecap="round"/>
            <!-- Leaf -->
            <path d="M 2,-8 Q 4,-8 4,-6 Q 4,-4 2,-4 Z" fill="#66bb6a"/>
          </g>
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 52),
      anchor: new google.maps.Point(20, 52),
    },
  };
  
  ngOnInit(): void {
    this.loadVineyards();
  }
  
  private loadVineyards(): void {
    this.masterDataService.getVineyardsDropdown().subscribe({
      next: (vineyards) => {
        // Ensure coordinates are numbers, not strings
        const processedVineyards = vineyards.map(v => ({
          ...v,
          latitude: v.latitude ? Number(v.latitude) : null,
          longitude: v.longitude ? Number(v.longitude) : null
        }));
        this.vineyards.set(processedVineyards);
        this.fitMapToBounds();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  private fitMapToBounds(): void {
    const vineyardsWithCoords = this.vineyardsWithCoords().filter(v => 
      typeof v.latitude === 'number' && 
      typeof v.longitude === 'number' &&
      !isNaN(v.latitude) && 
      !isNaN(v.longitude)
    );
    
    if (vineyardsWithCoords.length === 0) return;
    
    if (vineyardsWithCoords.length === 1) {
      // Single vineyard - center on it
      const v = vineyardsWithCoords[0];
      this.mapCenter = { lat: v.latitude!, lng: v.longitude! };
      this.mapZoom = 14;
    } else {
      // Multiple vineyards - fit bounds
      const bounds = new google.maps.LatLngBounds();
      vineyardsWithCoords.forEach(v => {
        bounds.extend({ lat: v.latitude!, lng: v.longitude! });
      });
      
      // Calculate center
      const center = bounds.getCenter();
      this.mapCenter = { lat: center.lat(), lng: center.lng() };
      
      // Estimate zoom level based on bounds
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = Math.abs(ne.lat() - sw.lat());
      const lngDiff = Math.abs(ne.lng() - sw.lng());
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Simple zoom calculation
      if (maxDiff > 10) this.mapZoom = 5;
      else if (maxDiff > 5) this.mapZoom = 6;
      else if (maxDiff > 2) this.mapZoom = 7;
      else if (maxDiff > 1) this.mapZoom = 8;
      else if (maxDiff > 0.5) this.mapZoom = 9;
      else if (maxDiff > 0.2) this.mapZoom = 10;
      else this.mapZoom = 11;
    }
  }
  
  onMarkerClick(vineyard: VineyardBlockDropdown): void {
    this.selectedVineyard.set(vineyard);
  }
}
