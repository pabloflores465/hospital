import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Panel de navegación lateral -->
        <div class="md:w-1/4 bg-white p-4 rounded-lg shadow">
          <nav class="space-y-2">
            <a routerLink="appointments" routerLinkActive="bg-blue-100 text-blue-700" 
               class="block p-2 rounded hover:bg-gray-100">
              Citas
            </a>
            <a routerLink="history" routerLinkActive="bg-blue-100 text-blue-700" 
               class="block p-2 rounded hover:bg-gray-100">
              Historial
            </a>
            <a routerLink="prescriptions" routerLinkActive="bg-blue-100 text-blue-700" 
               class="block p-2 rounded hover:bg-gray-100">
              Prescripciones
            </a>
            <a routerLink="recipes" routerLinkActive="bg-blue-100 text-blue-700" 
               class="block p-2 rounded hover:bg-gray-100">
              Mis Recetas
            </a>
            <a routerLink="medical-record" routerLinkActive="bg-blue-100 text-blue-700" 
               class="block p-2 rounded hover:bg-gray-100">
              Ficha Médica
            </a>
          </nav>
        </div>
        
        <!-- Contenido principal -->
        <div class="md:w-3/4 bg-white p-4 rounded-lg shadow">
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
export class PatientDashboardComponent {
  nextAppointment: any = null;
  recentPrescriptions: any[] = [];

  constructor(private userService: UserService) {
    // Aquí se cargarían los datos reales desde un servicio
    this.loadMockData();
  }

  private loadMockData() {
    // Datos de ejemplo
    this.nextAppointment = {
      date: new Date(2024, 2, 20, 14, 30),
      doctor: 'Dr. García',
      specialty: 'Medicina General'
    };

    this.recentPrescriptions = [
      { id: 1, date: new Date(2024, 2, 15), medication: 'Paracetamol 500mg' },
      { id: 2, date: new Date(2024, 2, 10), medication: 'Ibuprofeno 400mg' }
    ];
  }
} 