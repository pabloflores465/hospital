import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { ButtonComponent } from '../../button/button.component';
import { RouterModule } from '@angular/router';

interface Medicine {
  name: string;
  dosis: string;
  frequency: string;
  duration: string;
}

@Component({
  selector: 'app-add-prescription',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Nueva Receta Médica</h2>
        <app-button routerLink="/prescriptions">Volver a Recetas</app-button>
      </div>

      @if (errorMessage()) {
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage() }}
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ID del Paciente
            </label>
            <input
              type="text"
              [(ngModel)]="patientId"
              name="patientId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
          </div>

          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Código de Receta
            </label>
            <input
              type="text"
              [(ngModel)]="code"
              name="code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
          </div>
        </div>

        <div class="medicines-section">
          <h3 class="text-lg font-medium mb-4">Medicamentos</h3>
          
          @for (medicine of medicines; track $index) {
            <div class="medicine-form bg-gray-50 p-4 rounded-md mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Medicamento
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="medicine.name"
                    [name]="'medicine-name-' + $index"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>

                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Dosis
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="medicine.dosis"
                    [name]="'medicine-dosis-' + $index"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>

                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="medicine.frequency"
                    [name]="'medicine-frequency-' + $index"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>

                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Duración
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="medicine.duration"
                    [name]="'medicine-duration-' + $index"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>
              </div>

              @if (medicines.length > 1) {
                <button
                  type="button"
                  (click)="removeMedicine($index)"
                  class="mt-2 text-red-600 hover:text-red-800"
                >
                  Eliminar Medicamento
                </button>
              }
            </div>
          }

          <button
            type="button"
            (click)="addMedicine()"
            class="mb-4 text-blue-600 hover:text-blue-800"
          >
            + Agregar Medicamento
          </button>
        </div>

        <div class="flex justify-end space-x-4">
          <app-button
            [loading]="loading()"
            type="submit"
            class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Guardar Receta
          </app-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100%;
      background-color: #f9fafb;
    }
  `]
})
export class AddPrescriptionComponent {
  patientId = '';
  code = '';
  medicines: Medicine[] = [{ name: '', dosis: '', frequency: '', duration: '' }];
  loading = signal(false);
  errorMessage = signal('');

  constructor(private doctorService: DoctorService) {}

  addMedicine() {
    this.medicines.push({ name: '', dosis: '', frequency: '', duration: '' });
  }

  removeMedicine(index: number) {
    if (this.medicines.length > 1) {
      this.medicines.splice(index, 1);
    }
  }

  async onSubmit() {
    if (!this.patientId || !this.code || this.medicines.length === 0) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      this.loading.set(true);
      await this.doctorService.createRecipe({
        patient: this.patientId,
        code: this.code,
        medicines: this.medicines,
        date: new Date()
      });
      // Limpiar el formulario después de guardar
      this.patientId = '';
      this.code = '';
      this.medicines = [{ name: '', dosis: '', frequency: '', duration: '' }];
      this.errorMessage.set('');
    } catch (error) {
      console.error('Error al crear la receta:', error);
      this.errorMessage.set('Error al guardar la receta médica');
    } finally {
      this.loading.set(false);
    }
  }
} 