import { Component, signal } from '@angular/core';
import axios from 'axios';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-hospital-vision',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <ng-container *ngIf="!edit()">
      <section
        class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4"
      >
        <div class="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold mb-4 text-center text-gray-800">
            {{ vision().title1 }}
          </h1>
          <p class="text-gray-600 mb-6 text-center">
            {{ vision().text1 }}
          </p>

          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">
              {{ vision().subtitle1 }}
            </h2>
            <ul class="list-disc ml-6 text-gray-700 space-y-2">
              <li>{{ vision().content1 }}</li>
              <li>{{ vision().content2 }}</li>
              <li>{{ vision().content3 }}</li>
            </ul>
          </div>

          <div class="flex flex-col md:flex-row gap-4">
            <div class="bg-gray-100 rounded-lg p-4 flex-1">
              <h3 class="text-lg font-semibold mb-2 text-gray-800">
                {{ vision().subtitle2 }}
              </h3>
              <p class="text-gray-600">
                <!-- Puedes reemplazar este texto con vision().contentX o como necesites -->
                Ejemplo de contenido para la sección.
              </p>
            </div>
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
      </section>
    </ng-container>

    <ng-container *ngIf="edit()">
      <div class="container mx-auto px-4 py-8">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Título</label
          >
          <input
            type="text"
            [(ngModel)]="vision().title1"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Texto Principal</label
          >
          <textarea
            [(ngModel)]="vision().text1"
            rows="3"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Subtítulo 1</label
          >
          <input
            type="text"
            [(ngModel)]="vision().subtitle1"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Contenido 1</label
          >
          <textarea
            [(ngModel)]="vision().content1"
            rows="2"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Contenido 2</label
          >
          <textarea
            [(ngModel)]="vision().content2"
            rows="2"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Contenido 3</label
          >
          <textarea
            [(ngModel)]="vision().content3"
            rows="2"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Subtítulo 2</label
          >
          <input
            type="text"
            [(ngModel)]="vision().subtitle2"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
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
    </ng-container>
  `,
  styles: [],
})
export class HospitalVisionComponent {
  vision = signal<any>({});
  edit = signal(false);

  ngOnInit() {
    this.getVision();
  }

  async getVision() {
    try {
      const url = await back_url();
      const response = await axios.get(`${url}/vision`);
      this.vision.set(response.data.history);
    } catch (error) {
      console.error(error);
    }
  }

  enableEdit() {
    this.edit.set(true);
  }

  cancel() {
    // Recargamos la visión original
    this.getVision();
    this.edit.set(false);
  }

  async save() {
    try {
      const url = await back_url();
      const response = await axios.put(`${url}/vision/moderation/`, {
        _id: this.vision()._id,
        title1: this.vision().title1,
        text1: this.vision().text1,
        subtitle1: this.vision().subtitle1,
        subtitle2: this.vision().subtitle2,
        content1: this.vision().content1,
        content2: this.vision().content2,
        content3: this.vision().content3,
      });
      const response2 = await axios.put(`${url}/vision/audit/`, {
        _id: this.vision()._id,
        title1: this.vision().title1,
        text1: this.vision().text1,
        subtitle1: this.vision().subtitle1,
        subtitle2: this.vision().subtitle2,
        content1: this.vision().content1,
        content2: this.vision().content2,
        content3: this.vision().content3,
      });
      console.log(response.data.message);
      console.log(response2.data.message);
      this.edit.set(false);
    } catch (error) {
      console.error(error);
    }
  }
}
