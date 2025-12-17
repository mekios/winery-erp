import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface FilterOption {
  value: string | boolean | null;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule, MatRippleModule],
  template: `
    <button class="chip" 
            [class.active]="hasValue"
            [matMenuTriggerFor]="menu"
            matRipple>
      <span class="chip-label">{{ label }}</span>
      @if (hasValue) {
        <span class="chip-dot"></span>
        <span class="chip-value">{{ getSelectedLabel() }}</span>
      }
      <mat-icon class="chip-arrow">keyboard_arrow_down</mat-icon>
    </button>
    
    <mat-menu #menu="matMenu" class="fresh-menu">
      @for (opt of options; track opt.value) {
        <button class="menu-item" 
                [class.selected]="opt.value === value"
                (click)="selectOption(opt.value)">
          @if (opt.icon) {
            <mat-icon>{{ opt.icon }}</mat-icon>
          }
          <span>{{ opt.label }}</span>
          @if (opt.value === value) {
            <mat-icon class="check">check_circle</mat-icon>
          }
        </button>
      }
      
      @if (hasValue) {
        <div class="menu-divider"></div>
        <button class="menu-item clear" (click)="selectOption(null)">
          <mat-icon>close</mat-icon>
          <span>Clear filter</span>
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #fff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #6b7280;
      
      &:hover {
        border-color: #d1d5db;
        background: #fafafa;
      }
      
      &.active {
        background: linear-gradient(135deg, rgba(124,77,255,0.08), rgba(124,77,255,0.04));
        border-color: #7c4dff;
        color: #7c4dff;
        
        .chip-value {
          font-weight: 600;
          color: #5b21b6;
        }
        
        .chip-arrow { color: #7c4dff; }
      }
      
      .chip-label {
        color: #9ca3af;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .chip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #7c4dff;
      }
      
      .chip-value {
        color: #374151;
      }
      
      .chip-arrow {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #9ca3af;
        transition: transform 0.2s;
      }
    }
    
    ::ng-deep .fresh-menu {
      .mat-mdc-menu-content {
        padding: 6px !important;
      }
      
      .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        background: none;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        color: #374151;
        cursor: pointer;
        transition: all 0.15s;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #9ca3af;
        }
        
        .check {
          margin-left: auto;
          color: #7c4dff;
        }
        
        &:hover {
          background: #f5f3ff;
        }
        
        &.selected {
          background: linear-gradient(135deg, rgba(124,77,255,0.12), rgba(124,77,255,0.06));
          color: #7c4dff;
          font-weight: 600;
        }
        
        &.clear {
          color: #6b7280;
          mat-icon { color: #9ca3af; }
          &:hover { background: #f3f4f6; }
        }
      }
      
      .menu-divider {
        height: 1px;
        background: #f3f4f6;
        margin: 6px 0;
      }
    }
  `]
})
export class FilterChipComponent {
  @Input() label = 'Filter';
  @Input() options: FilterOption[] = [];
  @Input() value: string | boolean | null = null;
  @Output() valueChange = new EventEmitter<string | boolean | null>();
  
  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined;
  }
  
  getSelectedLabel(): string {
    const opt = this.options.find(o => o.value === this.value);
    return opt?.label || String(this.value);
  }
  
  selectOption(val: string | boolean | null): void {
    this.value = val;
    this.valueChange.emit(val);
  }
}
