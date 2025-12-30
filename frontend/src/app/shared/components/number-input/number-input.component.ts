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
  styles: [`
    .number-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .input-container {
      display: flex;
      align-items: stretch;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary-light);
      }
    }
    
    .number-input-wrapper.focused .input-container {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
    
    .number-input-wrapper.disabled .input-container {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .stepper-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      min-height: 48px;
      border: none;
      background: var(--gray-50);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      
      &:hover:not(:disabled) {
        background: var(--gray-100);
        color: var(--primary);
      }
      
      &:active:not(:disabled) {
        transform: scale(0.95);
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      &.minus {
        border-right: 1px solid var(--border-color);
      }
      
      &.plus {
        border-left: 1px solid var(--border-color);
      }
    }
    
    .value-display {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0 0.75rem;
      min-width: 100px;
    }
    
    .number-field {
      border: none;
      background: transparent;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      text-align: center;
      width: 100%;
      min-width: 60px;
      padding: 0.5rem 0;
      
      &:focus {
        outline: none;
      }
      
      &::placeholder {
        color: var(--text-muted);
        font-weight: 400;
      }
      
      &:disabled {
        color: var(--text-secondary);
      }
    }
    
    .unit-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
      padding: 0.25rem 0.5rem;
      background: var(--gray-100);
      border-radius: 6px;
    }
    
    .progress-bar {
      height: 4px;
      background: var(--gray-100);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--primary-light));
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    
    .quick-values {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .quick-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      
      &:hover:not(:disabled) {
        background: var(--gray-100);
        border-color: var(--primary-light);
        color: var(--primary);
      }
      
      &.active {
        background: rgba(124, 58, 237, 0.1);
        border-color: var(--primary);
        color: var(--primary);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
      .input-container {
        border-radius: 10px;
      }
      
      .stepper-btn {
        width: 40px;
        min-height: 44px;
        
        svg {
          width: 14px;
          height: 14px;
        }
      }
      
      .value-display {
        padding: 0 0.5rem;
        min-width: 80px;
        gap: 0.25rem;
      }
      
      .number-field {
        font-size: 16px; /* Prevents iOS zoom */
        padding: 0.375rem 0;
      }
      
      .unit-label {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
      }
      
      .progress-bar {
        height: 3px;
      }
      
      .quick-values {
        gap: 0.375rem;
      }
      
      .quick-btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
        border-radius: 6px;
      }
    }
  `],
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



