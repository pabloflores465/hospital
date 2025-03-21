import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-4xl font-bold mb-8 text-center">Preguntas Frecuentes</h1>

      <!-- Formulario para agregar nueva pregunta -->
      <div class="mb-8 p-4 border rounded bg-gray-50">
        <h2 class="text-2xl font-bold mb-4">Agregar Nueva Pregunta</h2>
        <div class="mb-4">
          <label class="block text-gray-700">Pregunta:</label>
          <input
            type="text"
            [(ngModel)]="newQuestion"
            class="w-full border rounded px-3 py-2"
            placeholder="Escribe la pregunta"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Respuesta:</label>
          <textarea
            [(ngModel)]="newAnswer"
            class="w-full border rounded px-3 py-2"
            placeholder="Escribe la respuesta"
          ></textarea>
        </div>
        <button
          (click)="addFAQ()"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Agregar Pregunta
        </button>
      </div>

      <!-- Listado de preguntas frecuentes -->
      <div *ngFor="let faq of faqs" class="mb-6 border-b border-gray-300 pb-4">
        <h2 class="text-2xl font-semibold text-gray-800">{{ faq.question }}</h2>
        <p class="mt-2 text-gray-600" [innerHTML]="faq.answer"></p>
      </div>
    </div>
  `,
  styles: [
    `
      /* Puedes agregar estilos personalizados adicionales aquí si lo deseas */
    `,
  ],
})
export class FaqComponent {
  faqs: FAQ[] = [
    {
      question: '¿Cómo instalo la aplicación?',
      answer:
        'Puedes instalar la aplicación ejecutando el comando <code>npm install</code> en la terminal.',
    },
    {
      question: '¿Cómo uso la aplicación?',
      answer:
        'Inicia el servidor de desarrollo con <code>ng serve</code> y visita <code>http://localhost:4200</code> en tu navegador.',
    },
    {
      question: '¿Dónde encuentro la documentación?',
      answer:
        'La documentación se encuentra en el repositorio oficial o en el sitio web del proyecto.',
    },
  ];

  newQuestion: string = '';
  newAnswer: string = '';

  addFAQ(): void {
    if (this.newQuestion.trim() && this.newAnswer.trim()) {
      this.faqs.push({
        question: this.newQuestion.trim(),
        answer: this.newAnswer.trim(),
      });
      // Limpiar campos después de agregar
      this.newQuestion = '';
      this.newAnswer = '';
    }
  }
}
