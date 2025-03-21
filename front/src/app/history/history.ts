import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-hospital-history',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
        <ng-container *ngIf="!edit(); else editTemplate">{{
          history().title
        }}</ng-container>
      </h1>
      <div class="bg-white shadow-md rounded-lg p-6">
        <ng-container *ngIf="!edit(); else editTemplate">
          <p class="text-gray-700 text-lg">{{ history().content }}</p>
        </ng-container>
      </div>
      <div class="mt-4 text-center">
        <button (click)="edit.set(!edit())" class="px-4 py-2 border rounded">
          {{ edit() ? 'Cancelar' : 'Editar' }}
        </button>
      </div>
      <ng-template #editTemplate>
        <div class="bg-white shadow-md rounded-lg p-6 space-y-4">
          <input
            type="text"
            [(ngModel)]="history().title"
            placeholder="{{ history().title }}"
            class="w-full border px-3 py-2 rounded"
          />
          <textarea
            [(ngModel)]="history().content"
            placeholder="{{ history().content }}"
            class="w-full border px-3 py-2 rounded"
          ></textarea>
          <div class="text-center">
            <button (click)="saveHistory()" class="px-4 py-2 border rounded">
              Guardar
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class HospitalHistoryComponent {
  history = signal<{ _id: string; title: string; content: string }>({
    _id: '',
    title: '',
    content: '',
  });

  edit = signal(false);

  async ngOnInit() {
    await this.getHistory();
  }

  async getHistory() {
    axios
      .get('http://127.0.0.1:8000/history/')
      .then((response) => {
        this.history.set(response.data?.history ?? {});
        console.log(this.history);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async saveHistory() {
    /* TODO: implement save functionality */
  }
}
