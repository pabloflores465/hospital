import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Panel lateral de navegación -->
        <div class="md:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4">Panel del Doctor</h2>
          <nav class="space-y-2">
            <a routerLink="agenda" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Agenda
            </a>
            <a routerLink="patient-history" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Historial de Pacientes
            </a>
            <a routerLink="/doctor/recipes" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Recetas
            </a>
            <a routerLink="/medical-record/patients" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Ficha Médica
            </a>
          </nav>
          <a routerLink="/doctor/recipes" class="btn btn-primary">Nueva Receta</a>
        </div>

        <!-- Contenido principal -->
        <div class="md:col-span-3 bg-white rounded-lg shadow p-6">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f9fafb;
    }
  `]
})
export class DoctorDashboardComponent { }
