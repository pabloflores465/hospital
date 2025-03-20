import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import axios from 'axios';

interface Doctor {
  username: string;
  email: string;
  title: string;
  grad_date: string;
  university: string;
  doctor_registration_number: number;
  photo: string;
  title_photo: string;
  phone1: number;
  phone2: number;
  patients: { name: string; email: string }[];
}

@Component({
  selector: 'doctor-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
        <div
          class="bg-white rounded-lg shadow p-4 border-2 border-gray-50"
          *ngFor="let doctor of doctors"
        >
          <img
            height="250px"
            width="250px"
            [src]="doctor.photo"
            class="mb-8 mx-auto"
          />
          <h2 class="text-xl font-bold mb-6 flex w-full text-center mx-auto">
            {{ doctor.username }}
          </h2>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Especialidad:</span>
            {{ doctor.title }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Fecha de Graduación:</span>
            {{ doctor.grad_date }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Universidad:</span>
            {{ doctor.university }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Número de Colegiado:</span>
            {{ doctor.doctor_registration_number }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Teléfono Primario:</span>
            {{ doctor.phone1 }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Teléfono Auxiliar:</span>
            {{ doctor.phone2 }}
          </p>
          <p class="text-gray-600 mb-4 flex">
            <span class="font-bold me-2">Correo:</span>
            {{ doctor.email }}
          </p>
          <p class="font-bold text-gray-600 mb-2">Fotografía del Titulo:</p>
          <img
            width="250px"
            height="250px"
            class="mx-auto mb-6"
            [src]="doctor.title_photo"
          />
          <p class="text-gray-600 mb-4 flex font-bold ">
            <span>Pacientes:</span>
          </p>
          <div class="ms-8" *ngFor="let patient of doctor.patients">
            <p class="text-sm text-gray-400">
              <span class="font-bold me-2 ">Nombre:</span>patient.name
            </p>
            <p class="text-sm text-gray-400">
              <span class="font-bold me-2">Email:</span>patient.email
            </p>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class DoctorList {
  async ngOnInit() {
    await this.getDoctors();
  }

  doctors: Doctor[] = [];

  async getDoctors() {
    axios('http://127.0.0.1:8000/doctors')
      .then((response) => {
        console.log(response.data);
        for (let current_doctor of response.data.doctors) {
          let doctor: Doctor = {
            username: current_doctor.username,
            title: current_doctor.profile.title,
            email: current_doctor.email,
            grad_date: current_doctor.profile.grad_date.split('T')[0],
            university: current_doctor.profile.university,
            doctor_registration_number:
              current_doctor.profile.doctor_registration_number,
            photo: current_doctor.profile.photo,
            title_photo: current_doctor.profile.title_photo,
            phone1: current_doctor.profile.phone1,
            phone2: current_doctor.profile.phone2,
            patients: current_doctor.profile.patients.map((patient: any) => ({
              name: patient.name,
              email: patient.email,
            })),
          };
          this.doctors.push(doctor);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
