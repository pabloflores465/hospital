import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import axios from 'axios';
import { FormsModule } from '@angular/forms';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-hospital-history',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <ng-container *ngIf="!edit()">
        <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
          {{ history().title }}
        </h1>
        <div class="bg-white shadow-md rounded-lg p-6">
          <p class="text-gray-700 text-lg">
            {{ history().content }}
          </p>
        </div>
        <div class="mt-4 text-center">
          <button
            (click)="enableEdit()"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Editar
          </button>
        </div>
      </ng-container>
      <ng-container *ngIf="edit()">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Título</label
          >
          <input
            type="text"
            [(ngModel)]="history().title"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Contenido</label
          >
          <textarea
            [(ngModel)]="history().content"
            rows="4"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>
        <div class="flex justify-center">
          <button
            (click)="save()"
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Guardar
          </button>
          <button
            (click)="cancel()"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
        </div>
      </ng-container>
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
    const url = await back_url();
    axios
      .get(`${url}/history/`)
      .then((response) => {
        this.history.set(response.data.history);
        console.log(this.history);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  enableEdit() {
    this.edit.set(true);
  }

  cancel() {
    // Reload the original history to discard changes
    this.getHistory();
    this.edit.set(false);
  }

  async save() {
    try {
      const url = await back_url();
      const response = await axios.put(`${url}/history/moderation/`, {
        _id: this.history()._id,
        title: this.history().title,
        content: this.history().content,
      });
      const response2 = await axios.put(`${url}/history/audit/`, {
        _id: this.history()._id,
        title: this.history().title,
        content: this.history().content,
      });
      console.log(response.data.message);
      console.log(response2.data.message);
      this.edit.set(false);
    } catch (error) {
      console.error(error);
    }
  }
}
