import { Component, signal } from '@angular/core';
import axios from 'axios';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Vista modo lectura (cuando edit() === false) -->
    <ng-container *ngIf="!edit()">
      <div class="container mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8 text-center">
          Preguntas Frecuentes
        </h1>

        <div class="mb-6 border-b border-gray-300 pb-4">
          <h2 class="text-2xl font-semibold text-gray-800">
            {{ faq().question1 }}
          </h2>
          <p class="mt-2 text-gray-600">{{ faq().answer1 }}</p>
        </div>

        <div class="mb-6 border-b border-gray-300 pb-4">
          <h2 class="text-2xl font-semibold text-gray-800">
            {{ faq().question2 }}
          </h2>
          <p class="mt-2 text-gray-600">{{ faq().answer2 }}</p>
        </div>

        <div class="mb-6 border-b border-gray-300 pb-4">
          <h2 class="text-2xl font-semibold text-gray-800">
            {{ faq().question3 }}
          </h2>
          <p class="mt-2 text-gray-600">{{ faq().answer3 }}</p>
        </div>

        <div class="text-center mt-6">
          <button
            (click)="enableEdit()"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Editar
          </button>
        </div>
      </div>
    </ng-container>

    <!-- Vista modo edición (cuando edit() === true) -->
    <ng-container *ngIf="edit()">
      <div class="container mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8 text-center">
          Editar Preguntas Frecuentes
        </h1>

        <!-- Question 1 -->
        <div class="mb-4">
          <label class="block text-gray-700">Pregunta 1:</label>
          <input
            type="text"
            [(ngModel)]="faq().question1"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Respuesta 1:</label>
          <textarea
            [(ngModel)]="faq().answer1"
            class="w-full border rounded px-3 py-2"
            rows="3"
          ></textarea>
        </div>

        <!-- Question 2 -->
        <div class="mb-4">
          <label class="block text-gray-700">Pregunta 2:</label>
          <input
            type="text"
            [(ngModel)]="faq().question2"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Respuesta 2:</label>
          <textarea
            [(ngModel)]="faq().answer2"
            class="w-full border rounded px-3 py-2"
            rows="3"
          ></textarea>
        </div>

        <!-- Question 3 -->
        <div class="mb-4">
          <label class="block text-gray-700">Pregunta 3:</label>
          <input
            type="text"
            [(ngModel)]="faq().question3"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Respuesta 3:</label>
          <textarea
            [(ngModel)]="faq().answer3"
            class="w-full border rounded px-3 py-2"
            rows="3"
          ></textarea>
        </div>

        <div class="text-center mt-6">
          <button
            (click)="save()"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4"
          >
            Guardar
          </button>
          <button
            (click)="cancel()"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [],
})
export class FaqComponent {
  faq = signal<any>({});
  edit = signal(false);

  ngOnInit() {
    this.getFaq();
  }

  async getFaq() {
    try {
      const url = await back_url();
      const response = await axios.get(`${url}/faq`);
      // Se asume que la respuesta viene como { history: { ... } }
      this.faq.set(response.data.history);
    } catch (error) {
      console.error(error);
    }
  }

  enableEdit() {
    this.edit.set(true);
  }

  cancel() {
    // Recarga los datos originales para descartar cambios
    this.getFaq();
    this.edit.set(false);
  }

  async save() {
    try {
      const url = await back_url();
      const response = await axios.put(`${url}/faq/moderation/`, {
        _id: this.faq()._id,
        question1: this.faq().question1,
        answer1: this.faq().answer1,
        question2: this.faq().question2,
        answer2: this.faq().answer2,
        question3: this.faq().question3,
        answer3: this.faq().answer3,
      });
      const response2 = await axios.put(`${url}/faq/audit/`, {
        _id: this.faq()._id,
        question1: this.faq().question1,
        answer1: this.faq().answer1,
        question2: this.faq().question2,
        answer2: this.faq().answer2,
        question3: this.faq().question3,
        answer3: this.faq().answer3,
      });
      console.log(response.data.message);
      console.log(response2.data.message);
      this.edit.set(false);
    } catch (error) {
      console.error(error);
    }
  }
}
