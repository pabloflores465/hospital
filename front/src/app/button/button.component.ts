import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  click = output();
  styles = input('');
  label = input('Click me');
  layout = input('');
  disabled = input(false);
}
