import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Panel lateral de navegación -->
        <div class="md:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4">Panel del Paciente</h2>
          <nav class="space-y-2">
            <a routerLink="/patient/appointments" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Mis Citas
            </a>
            <a routerLink="/patient/history" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Mi Historial Médico
            </a>
            <a routerLink="/patient/prescriptions" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="block px-4 py-2 rounded-md hover:bg-gray-100">
              Mis Recetas
            </a>
          </nav>
        </div>

        <!-- Contenido principal -->
        <div class="md:col-span-3">
          <!-- Resumen -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold mb-4">Próxima Cita</h3>
              @if (nextAppointment) {
                <div>
                  <p class="text-gray-600">Fecha: {{ nextAppointment.date | date }}</p>
                  <p class="text-gray-600">Doctor: {{ nextAppointment.doctor }}</p>
                  <p class="text-gray-600">Especialidad: {{ nextAppointment.specialty }}</p>
                </div>
              } @else {
                <p class="text-gray-500">No tienes citas programadas</p>
              }
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold mb-4">Últimas Recetas</h3>
              @if (recentPrescriptions.length > 0) {
                <ul class="space-y-2">
                  @for (prescription of recentPrescriptions; track prescription.id) {
                    <li class="text-gray-600">
                      {{ prescription.date | date }}: {{ prescription.medication }}
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-gray-500">No hay recetas recientes</p>
              }
            </div>
          </div>

          <!-- Router Outlet para contenido anidado -->
          <div class="bg-white rounded-lg shadow p-6">
            <router-outlet></router-outlet>
          </div>
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