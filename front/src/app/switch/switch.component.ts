import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  imports: [],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.css',
})
export class SwitchComponent {
  update_checked = output<boolean>();
  disabled = input(false);
  checked = input(false);
  bind = input(false);
  style = input('');
  label = input('');
  reverse = input(false);
  scale = input(1);

  wrapperStyle = computed(
    () =>
      `transform: scale(${this.scale()}); transform-origin: top left; ${this.style()}`
  );

  onChangeHandler(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.update_checked.emit(isChecked);
  }
}
