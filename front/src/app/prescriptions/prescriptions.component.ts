import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Recipe } from '../services/doctor.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Mis Recetas Médicas</h2>

      @if (errorMessage()) {
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage() }}
        </div>
      }

      @if (loading()) {
        <div class="text-center py-4">
          <span class="text-gray-600">Cargando recetas...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (recipe of recipes; track recipe._id) {
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-semibold">Paciente: {{ recipe.patient }}</h3>
                  <p class="text-sm text-gray-600">Código: {{ recipe.code }}</p>
                  <p class="text-sm text-gray-600">Fecha: {{ recipe.date | date }}</p>
                </div>
              </div>

              <div class="mt-4">
                <h4 class="font-medium mb-2">Medicamentos:</h4>
                <ul class="space-y-2">
                  @for (medicine of recipe.medicines; track $index) {
                    <li class="bg-gray-50 p-3 rounded">
                      <p class="font-medium">{{ medicine.name }}</p>
                      <p class="text-sm text-gray-600">Dosis: {{ medicine.dosis }}</p>
                      <p class="text-sm text-gray-600">Frecuencia: {{ medicine.frequency }}</p>
                      <p class="text-sm text-gray-600">Duración: {{ medicine.duration }}</p>
                    </li>
                  }
                </ul>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-8 text-gray-600">
              No hay recetas disponibles
            </div>
          }
        </div>
      }
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
export class PrescriptionsComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private doctorService: DoctorService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    await this.loadRecipes();
  }

  async loadRecipes() {
    try {
      this.loading.set(true);
      const currentUser = this.userService.getUser();
      if (currentUser) {
        this.recipes = await this.doctorService.getDoctorRecipes(currentUser._id);
      }
    } catch (error) {
      console.error('Error al cargar recetas:', error);
      this.errorMessage.set('Error al cargar las recetas médicas');
    } finally {
      this.loading.set(false);
    }
  }
}
