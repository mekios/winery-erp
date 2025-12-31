import { Component, Input, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="number-input-wrapper" [class.focused]="focused()" [class.disabled]="disabled">
      <div class="input-container">
        <button 
          type="button" 
          class="stepper-btn minus" 
          (click)="decrement()"
          [disabled]="disabled || (min !== undefined && (value() ?? 0) <= min)"
          tabindex="-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <div class="value-display">
          <input 
            type="text"
            [value]="displayValue()"
            (input)="onInputChange($event)"
            (focus)="onFocus()"
            (blur)="onBlur()"
            [placeholder]="placeholder"
            [disabled]="disabled"
            class="number-field"
          />
          @if (unit) {
            <span class="unit-label">{{ unit }}</span>
          }
        </div>
        
        <button 
          type="button" 
          class="stepper-btn plus" 
          (click)="increment()"
          [disabled]="disabled || (max !== undefined && (value() ?? 0) >= max)"
          tabindex="-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      
      @if (showProgress && max) {
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
        </div>
      }
      
      @if (quickValues.length > 0) {
        <div class="quick-values">
          @for (qv of quickValues; track qv) {
            <button 
              type="button" 
              class="quick-btn" 
              [class.active]="value() === qv"
              (click)="setValue(qv)"
              [disabled]="disabled">
              {{ formatQuickValue(qv) }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./number-input.component.scss'],
})
export class NumberInputComponent implements ControlValueAccessor {
  @Input() unit = '';
  @Input() placeholder = '0';
  @Input() min?: number;
  @Input() max?: number;
  @Input() step = 1;
  @Input() decimals = 0;
  @Input() showProgress = false;
  @Input() quickValues: number[] = [];
  @Input() disabled = false;
  
  value = signal<number | null>(null);
  focused = signal(false);
  rawInputValue = signal<string>('');
  
  displayValue = computed(() => {
    // While focused, show the raw input value
    if (this.focused()) {
      return this.rawInputValue();
    }
    
    // When not focused, show formatted value
    const v = this.value();
    if (v === null || v === undefined) return '';
    return this.formatNumber(v);
  });
  
  progressPercent = computed(() => {
    const v = this.value() ?? 0;
    const max = this.max ?? 100;
    return Math.min(100, Math.max(0, (v / max) * 100));
  });
  
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  
  writeValue(value: number | null): void {
    this.value.set(value);
  }
  
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  onFocus(): void {
    this.focused.set(true);
    // Set raw value to current number value for editing
    const v = this.value();
    if (v !== null && v !== undefined) {
      this.rawInputValue.set(v.toString());
    } else {
      this.rawInputValue.set('');
    }
  }
  
  onBlur(): void {
    this.focused.set(false);
    this.rawInputValue.set('');
    
    // Apply formatting and clamping on blur
    const v = this.value();
    if (v !== null && v !== undefined) {
      const formatted = this.clamp(v);
      if (formatted !== v) {
        this.value.set(formatted);
        this.onChange(formatted);
      }
    }
    
    this.onTouched();
  }
  
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    
    // Update raw input value for display
    this.rawInputValue.set(raw);
    
    // Parse and update actual value
    const cleanedRaw = raw.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanedRaw);
    
    if (cleanedRaw === '' || cleanedRaw === '-') {
      // Allow empty or just minus sign while typing
      this.value.set(null);
      this.onChange(null);
    } else if (isNaN(num)) {
      // Invalid number, keep previous value but show what user typed
      // Don't update value
    } else {
      // Valid number - don't clamp while typing, just set the value
      this.value.set(num);
      this.onChange(num);
    }
  }
  
  increment(): void {
    const current = this.value() ?? 0;
    const newVal = this.clamp(current + this.step);
    this.value.set(newVal);
    this.onChange(newVal);
  }
  
  decrement(): void {
    const current = this.value() ?? 0;
    const newVal = this.clamp(current - this.step);
    this.value.set(newVal);
    this.onChange(newVal);
  }
  
  setValue(val: number): void {
    const clamped = this.clamp(val);
    this.value.set(clamped);
    this.onChange(clamped);
  }
  
  private clamp(val: number): number {
    if (this.min !== undefined && val < this.min) return this.min;
    if (this.max !== undefined && val > this.max) return this.max;
    return Number(val.toFixed(this.decimals));
  }
  
  private formatNumber(num: number): string {
    // Only apply minimum fraction digits if decimals > 0
    // This prevents adding ".00" to integers
    if (this.decimals === 0) {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    });
  }
  
  formatQuickValue(val: number): string {
    if (val >= 1000) {
      return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
    }
    return val.toString();
  }
}



