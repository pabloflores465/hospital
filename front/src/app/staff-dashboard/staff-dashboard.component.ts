import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Panel lateral de navegación -->
        <div class="md:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4">Panel de Personal</h2>
          <nav class="space-y-2">
            <a routerLink="agenda" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Agenda de Doctores
            </a>
            <a routerLink="patient-history" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Historial de Pacientes
            </a>
            <a routerLink="/appointments" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Gestión de Citas
            </a>
            <a routerLink="/medical-record/patients" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Ficha Médica
            </a>
            <a routerLink="reports" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Reportes
            </a>
          </nav>
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
    
    .btn-primary {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #3498db;
      color: white;
      border-radius: 0.25rem;
      text-decoration: none;
      font-weight: 500;
    }
    
    .btn-primary:hover {
      background-color: #217dbb;
    }
    
    .bg-blue-100 {
      background-color: #e3f2fd;
    }
    
    .text-blue-700 {
      color: #1976d2;
    }
  `]
})
export class StaffDashboardComponent {
  constructor(private userService: UserService) {}
} 