import { Component, signal } from '@angular/core';
import axios from 'axios';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hospital-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <ng-container *ngIf="!edit()">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
          {{ contact().title }}
        </h1>
        <div class="bg-white shadow-md rounded-lg p-6">
          <p class="text-gray-700 text-lg">
            {{ contact().text1 }}
          </p>
          <p class="text-gray-700 text-lg mt-4">
            {{ contact().text2 }}
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
      </div>
    </ng-container>

    <ng-container *ngIf="edit()">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
          Editar Contacto
        </h1>
        <div class="bg-white shadow-md rounded-lg p-6">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2"
              >Título</label
            >
            <input
              type="text"
              [(ngModel)]="contact().title"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2"
              >Texto 1</label
            >
            <textarea
              [(ngModel)]="contact().text1"
              rows="3"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            ></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2"
              >Texto 2</label
            >
            <textarea
              [(ngModel)]="contact().text2"
              rows="3"
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
        </div>
      </div>
    </ng-container>
  `,
})
export class HospitalContactComponent {
  // Usamos signals para manejar el estado de la info
  contact = signal<any>({});
  edit = signal(false);

  ngOnInit() {
    this.getContact();
  }

  // Consulta GET para obtener la información de contacto
  async getContact() {
    try {
      const response = await axios.get('http://127.0.0.1:8000/contact');
      // Se asume que la respuesta viene como { history: {...} }
      this.contact.set(response.data.history);
    } catch (error) {
      console.error(error);
    }
  }

  enableEdit() {
    this.edit.set(true);
  }

  cancel() {
    // Recargamos la info original
    this.getContact();
    this.edit.set(false);
  }

  // Petición PUT para pasar los cambios a moderación
  async save() {
    try {
      const response = await axios.put(
        'http://127.0.0.1:8000/contact/moderation/',
        {
          _id: this.contact()._id,
          title: this.contact().title,
          text1: this.contact().text1,
          text2: this.contact().text2,
        }
      );
      const response2 = await axios.put(
        'http://127.0.0.1:8000/contact/audit/',
        {
          _id: this.contact()._id,
          title: this.contact().title,
          text1: this.contact().text1,
          text2: this.contact().text2,
        }
      );
      console.log(response.data.message);
      console.log(response2.data.message);
      this.edit.set(false);
    } catch (error) {
      console.error(error);
    }
  }
}
