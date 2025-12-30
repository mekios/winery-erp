import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="map-picker-container">
      <google-map
        #googleMap
        [height]="'300px'"
        [width]="'100%'"
        [center]="mapCenter"
        [zoom]="mapZoom"
        [options]="mapOptions"
        (mapClick)="onMapClick($event)">
        
        @if (latitude && longitude) {
          <map-marker
            [position]="markerPosition"
            [options]="markerOptions">
          </map-marker>
        }
      </google-map>
      
      @if (latitude && longitude) {
        <div class="coordinates-display">
          <span class="coord-label">📍</span>
          <span class="coord-value">{{ latitude | number:'1.5-5' }}, {{ longitude | number:'1.5-5' }}</span>
          <button type="button" class="clear-btn" (click)="clearLocation($event)" title="Clear location">×</button>
        </div>
      } @else {
        <div class="coordinates-hint">
          Click on the map to set vineyard location
        </div>
      }
    </div>
  `,
  styles: [`
    .map-picker-container {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
    }
    
    google-map {
      display: block;
    }
    
    .coordinates-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      border-top: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .coord-label {
      font-size: 1rem;
    }
    
    .coord-value {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875rem;
      color: var(--text-primary);
      flex: 1;
    }
    
    .clear-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
    }
    
    .coordinates-hint {
      padding: 0.75rem 1rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      background: var(--gray-50);
      border-top: 1px solid var(--border-color);
      text-align: center;
    }
  `]
})
export class MapPickerComponent implements OnChanges {
  @ViewChild('googleMap', { static: false }) googleMap!: GoogleMap;
  
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() defaultCenter: google.maps.LatLngLiteral = { lat: 37.9838, lng: 23.7275 }; // Athens, Greece
  @Input() defaultZoom = 6;
  @Input() readonly = false;
  
  @Output() locationChange = new EventEmitter<{ latitude: number; longitude: number } | null>();
  
  mapCenter: google.maps.LatLngLiteral = this.defaultCenter;
  mapZoom = this.defaultZoom;
  
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    gestureHandling: 'cooperative',
  };
  
  markerOptions: google.maps.MarkerOptions = {
    draggable: !this.readonly,
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
  
  get markerPosition(): google.maps.LatLngLiteral {
    // Ensure coordinates are numbers
    const lat = typeof this.latitude === 'string' ? Number(this.latitude) : (this.latitude || 0);
    const lng = typeof this.longitude === 'string' ? Number(this.longitude) : (this.longitude || 0);
    
    return {
      lat: !isNaN(lat) ? lat : 0,
      lng: !isNaN(lng) ? lng : 0
    };
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['latitude'] || changes['longitude']) && this.latitude && this.longitude) {
      // Ensure coordinates are numbers
      const lat = typeof this.latitude === 'string' ? Number(this.latitude) : this.latitude;
      const lng = typeof this.longitude === 'string' ? Number(this.longitude) : this.longitude;
      
      if (!isNaN(lat) && !isNaN(lng)) {
        this.mapCenter = { lat, lng };
        this.mapZoom = 14;
      }
    }
    if (changes['readonly']) {
      this.markerOptions = {
        ...this.markerOptions,
        draggable: !this.readonly
      };
    }
  }
  
  onMapClick(event: google.maps.MapMouseEvent): void {
    if (this.readonly || !event.latLng) return;
    
    // Round to 8 decimal places (approximately 1.1mm precision)
    const lat = Math.round(event.latLng.lat() * 100000000) / 100000000;
    const lng = Math.round(event.latLng.lng() * 100000000) / 100000000;
    
    this.locationChange.emit({ latitude: lat, longitude: lng });
  }
  
  clearLocation(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.locationChange.emit(null);
  }
}
