import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { back_url } from '../../../environments/back_url';
import axios from 'axios';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <div class="py-10">
        <header>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-3xl font-bold leading-tight text-gray-900">
              Dashboard Administrativo
            </h1>
          </div>
        </header>
        <main>
          <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <!-- Estadísticas generales -->
            <div class="mt-8">
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Tarjeta de Doctores -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg
                          class="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt
                            class="text-sm font-medium text-gray-500 truncate"
                          >
                            Total Doctores
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              {{ doctor_count() }}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-5 py-3">
                    <div class="text-sm">
                      <a
                        routerLink="/admin/doctors"
                        class="font-medium text-blue-600 hover:text-blue-900"
                        >Ver todos los doctores</a
                      >
                    </div>
                  </div>
                </div>

                <!-- Tarjeta de Pacientes -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg
                          class="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt
                            class="text-sm font-medium text-gray-500 truncate"
                          >
                            Total Pacientes
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              {{ patient_count() }}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-5 py-3">
                    <div class="text-sm">
                      <a
                        routerLink="/admin/patients"
                        class="font-medium text-blue-600 hover:text-blue-900"
                        >Ver todos los pacientes</a
                      >
                    </div>
                  </div>
                </div>

                <!-- Tarjeta de Citas -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg
                          class="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt
                            class="text-sm font-medium text-gray-500 truncate"
                          >
                            Citas Hoy
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              8
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-5 py-3">
                    <div class="text-sm">
                      <a
                        routerLink="/admin/appointments"
                        class="font-medium text-blue-600 hover:text-blue-900"
                        >Ver todas las citas</a
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Acciones Rápidas -->
            <div class="mt-8">
              <h2 class="text-lg leading-6 font-medium text-gray-900">
                Acciones Rápidas
              </h2>
              <div
                class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <button
                  class="relative block w-full rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white shadow"
                >
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M24 12v6m0 0v6m0-6h6m-6 0h-6"
                    />
                  </svg>
                  <span class="mt-2 block text-sm font-medium text-gray-900"
                    >Agregar Doctor</span
                  >
                </button>

                <button
                  class="relative block w-full rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white shadow"
                >
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M24 12v6m0 0v6m0-6h6m-6 0h-6"
                    />
                  </svg>
                  <span class="mt-2 block text-sm font-medium text-gray-900"
                    >Agregar Paciente</span
                  >
                </button>

                <button
                  class="relative block w-full rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white shadow"
                >
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M24 12v6m0 0v6m0-6h6m-6 0h-6"
                    />
                  </svg>
                  <span class="mt-2 block text-sm font-medium text-gray-900"
                    >Programar Cita</span
                  >
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: #f9fafb;
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  constructor() {}

  doctor_count = signal(0);
  patient_count = signal(0);

  async ngOnInit() {
    await this.getDoctorCount();
    await this.getPatientCount();
  }

  async getDoctorCount() {
    const url = await back_url();
    axios
      .get(`${url}/doctors/count`)
      .then((response) => {
        this.doctor_count.set(response.data.doctor_count);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getPatientCount() {
    const url = await back_url();
    axios
      .get(`${url}/patients/count`)
      .then((response) => {
        this.patient_count.set(response.data.patient_count);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
