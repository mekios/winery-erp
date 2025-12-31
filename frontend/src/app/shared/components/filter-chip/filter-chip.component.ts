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
  styleUrls: ['./filter-chip.component.scss']
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
