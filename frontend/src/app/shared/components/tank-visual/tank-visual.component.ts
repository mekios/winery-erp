import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TankColors {
  start: string;
  end: string;
}

@Component({
  selector: 'app-tank-visual',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="compact ? '0 0 200 300' : '0 0 200 300'" [class]="compact ? 'tank-svg-compact' : 'tank-svg'">
      <defs>
        <linearGradient [id]="'wineGradient-' + tankId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" [attr.style]="'stop-color:' + colors.start + ';stop-opacity:0.9'" />
          <stop offset="100%" [attr.style]="'stop-color:' + colors.end + ';stop-opacity:1'" />
        </linearGradient>
        <clipPath [id]="'liquidClip-' + tankId">
          <rect 
            x="0" 
            [attr.y]="270 - (240 * fillPercentage / 100)" 
            width="200" 
            [attr.height]="270 + (240 * fillPercentage / 100)"
          />
        </clipPath>
      </defs>
      
      <!-- Tank outline -->
      <ellipse cx="100" cy="30" rx="80" ry="15" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="20" y1="30" x2="20" y2="270" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="180" y1="30" x2="180" y2="270" stroke="#cbd5e1" stroke-width="2"/>
      <ellipse cx="100" cy="270" rx="80" ry="15" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      
      <!-- Inner liquid cylinder (clipped to height) -->
      @if (fillPercentage > 0) {
        <g [attr.clip-path]="'url(#liquidClip-' + tankId + ')'" class="liquid-cylinder">
          <!-- Cylinder body -->
          <rect x="22" y="30" width="156" height="240" [attr.fill]="'url(#wineGradient-' + tankId + ')'"/>
          <!-- Bottom ellipse -->
          <ellipse cx="100" cy="270" rx="78" ry="14" [attr.fill]="colors.end"/>
        </g>
      }
      
      <!-- Liquid surface (top ellipse) - rendered outside clip -->
      @if (fillPercentage > 0) {
        <ellipse 
          cx="100" 
          [attr.cy]="270 - (240 * fillPercentage / 100)" 
          rx="78" 
          ry="14" 
          [attr.fill]="'url(#wineGradient-' + tankId + ')'" 
          class="liquid-surface"
        />
        <!-- Surface highlight for 3D effect -->
        <ellipse 
          cx="100" 
          [attr.cy]="270 - (240 * fillPercentage / 100)" 
          rx="78" 
          ry="14" 
          [attr.fill]="colors.start" 
          opacity="0.3"
          class="liquid-highlight"
        />
      }
    </svg>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .tank-svg {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
    }
    
    .tank-svg-compact {
      width: 100%;
      height: auto;
    }
    
    .liquid-cylinder,
    .liquid-surface,
    .liquid-highlight {
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class TankVisualComponent {
  @Input() tankId: string = 'tank';
  @Input() fillPercentage: number = 0;
  @Input() colors: TankColors = { start: '#7c4dff', end: '#5e35d1' };
  @Input() compact: boolean = false;
}

