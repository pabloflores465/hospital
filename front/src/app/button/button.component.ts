import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="buttonClasses"
      class="px-4 py-2 rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      @if (loading) {
      <span class="inline-block animate-spin mr-2">⌛</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [],
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center';
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
      secondary:
        'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}
