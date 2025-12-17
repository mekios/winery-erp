import { Component, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Official Lucide Icons - MIT Licensed (https://lucide.dev)
const ICONS: Record<string, string> = {
  // Dashboard - House icon
  'dashboard': `
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  `,
  
  // Tank - Cylinder icon
  'tank': `
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
  `,
  
  // Barrel - Container icon (3D box)
  'barrel': `
    <path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/>
    <path d="M10 21.9V14L2.1 9.1"/>
    <path d="m10 14 11.9-6.9"/>
    <path d="M14 19.8v-8.1"/>
    <path d="M18 17.5V9.4"/>
  `,
  
  // Grape - Grape cluster icon
  'grape': `
    <path d="M22 5V2l-5.89 5.89"/>
    <circle cx="16.6" cy="15.89" r="3"/>
    <circle cx="8.11" cy="7.4" r="3"/>
    <circle cx="12.35" cy="11.65" r="3"/>
    <circle cx="13.91" cy="5.85" r="3"/>
    <circle cx="18.15" cy="10.09" r="3"/>
    <circle cx="6.56" cy="13.2" r="3"/>
    <circle cx="10.8" cy="17.44" r="3"/>
    <circle cx="5" cy="19" r="3"/>
  `,
  
  // Farmer - Tractor icon
  'farmer': `
    <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20"/>
    <path d="M16 18h-5"/>
    <path d="M18 5a1 1 0 0 0-1 1v5.573"/>
    <path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246"/>
    <path d="M4 11V4"/>
    <path d="M7 15h.01"/>
    <path d="M8 10.1V4"/>
    <circle cx="18" cy="18" r="2"/>
    <circle cx="7" cy="15" r="5"/>
  `,
  
  // Vineyard - Mountain/landscape icon
  'vineyard': `
    <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
  `,
  
  // Calendar - Calendar icon
  'calendar': `
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
  `,
  
  // Batch - Package icon
  'batch': `
    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
    <path d="M12 22V12"/>
    <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>
    <path d="m7.5 4.27 9 5.15"/>
  `,
  
  // Transfer - Arrow right left icon
  'transfer': `
    <path d="m16 3 4 4-4 4"/>
    <path d="M20 7H4"/>
    <path d="m8 21-4-4 4-4"/>
    <path d="M4 17h16"/>
  `,
  
  // Wine Lot - Wine glass icon
  'wine-lot': `
    <path d="M8 22h8"/>
    <path d="M7 10h10"/>
    <path d="M12 15v7"/>
    <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>
  `,
  
  // Flask - Flask conical icon
  'flask': `
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
    <path d="M8.5 2h7"/>
    <path d="M7 16h10"/>
  `,
  
  // Flask Conical - Erlenmeyer flask (alias for lab)
  'flask-conical': `
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
    <path d="M8.5 2h7"/>
    <path d="M7 16h10"/>
  `,
  
  // Arrow Right Left - Transfer icon
  'arrow-right-left': `
    <path d="m16 3 4 4-4 4"/>
    <path d="M20 7H4"/>
    <path d="m8 21-4-4 4-4"/>
    <path d="M4 17h16"/>
  `,
  
  // Wine - Wine glass icon  
  'wine': `
    <path d="M8 22h8"/>
    <path d="M7 10h10"/>
    <path d="M12 15v7"/>
    <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>
  `,
  
  // Building - Building 2 icon
  'building': `
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  `,
  
  // Users - Users icon
  'users': `
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `,
  
  // Common actions
  'add': `
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  `,
  
  'edit': `
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
    <path d="m15 5 4 4"/>
  `,
  
  'delete': `
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" x2="10" y1="11" y2="17"/>
    <line x1="14" x2="14" y1="11" y2="17"/>
  `,
  
  'search': `
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  `,
  
  'filter': `
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  `,
  
  'check': `
    <path d="M20 6 9 17l-5-5"/>
  `,
  
  'x': `
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  `,
  
  'chevron-down': `
    <path d="m6 9 6 6 6-6"/>
  `,
  
  'menu': `
    <line x1="4" x2="20" y1="12" y2="12"/>
    <line x1="4" x2="20" y1="6" y2="6"/>
    <line x1="4" x2="20" y1="18" y2="18"/>
  `,
  
  'user': `
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  `,
  
  'settings': `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `,
  
  'bell': `
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  `,
  
  'inbox': `
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  `,
  
  'eye': `
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
    <circle cx="12" cy="12" r="3"/>
  `,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg 
      [attr.width]="size" 
      [attr.height]="size" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      [innerHTML]="iconSvg">
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      display: block;
    }
  `]
})
export class IconComponent implements OnChanges {
  @Input() name: string = '';
  @Input() size: number = 24;
  
  iconSvg: SafeHtml = '';
  
  constructor(private sanitizer: DomSanitizer) {}
  
  ngOnChanges(): void {
    const svg = ICONS[this.name] || ICONS['inbox'];
    this.iconSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
