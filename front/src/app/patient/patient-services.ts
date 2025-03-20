import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import axios from 'axios';

interface Service {
  _id: string;
  name: string;
}

interface EnsuranceCompany {
  _id: string;
  name: string;
}

interface Profile {
  _id: string;
  services?: Service[];
  dpi?: number;
  affiliation_no?: number;
  license_no?: number;
  phone?: string;
  birth_date?: string;
  photo?: string;
  ensurance_company?: EnsuranceCompany;
}

interface Patient {
  _id: string;
  username: string;
  email: string;
  profile: Profile;
}

@Component({
  selector: 'patient-services',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="p-4">
      <h1 class="text-2xl font-bold mb-4 text-center">Listado de Pacientes</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          class="bg-white rounded-lg shadow p-4 border-2 border-gray-50"
          *ngFor="let patient of patients"
        >
          <h2 class="text-xl font-bold mb-4">{{ patient.username }}</h2>
          <p class="text-gray-600 mb-2">
            <strong>Correo:</strong> {{ patient.email }}
          </p>
          <div *ngIf="patient.profile && patient.profile._id; else noProfile">
            <p class="text-gray-600 mb-2">
              <strong>DPI:</strong> {{ patient.profile.dpi }}
            </p>
            <p class="text-gray-600 mb-2">
              <strong>Teléfono:</strong> {{ patient.profile.phone }}
            </p>
            <p class="text-gray-600 mb-2">
              <strong>Fecha de Nacimiento:</strong>
              {{ patient.profile.birth_date | date }}
            </p>
            <div *ngIf="patient.profile.ensurance_company">
              <p class="text-gray-600 mb-2">
                <strong>Compañía de Seguros:</strong>
                {{ patient.profile.ensurance_company.name }}
              </p>
            </div>
            <div
              *ngIf="
                patient.profile.services && patient.profile.services.length
              "
            >
              <p class="text-gray-600 mb-2 font-bold">Servicios:</p>
              <ul class="list-disc list-inside">
                <li *ngFor="let service of patient.profile.services">
                  {{ service.name }}
                </li>
              </ul>
            </div>
          </div>
          <ng-template #noProfile>
            <p class="text-red-500">Perfil no disponible.</p>
          </ng-template>
        </div>
      </div>
    </main>
  `,
  styles: [],
})
export class PatientServicesComponent {
  patients: Patient[] = [];

  async ngOnInit() {
    await this.getPatients();
  }

  async getPatients() {
    axios('http://127.0.0.1:8000/patient/services/')
      .then((response) => {
        console.log(response.data);
        this.patients = response.data.patients;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
