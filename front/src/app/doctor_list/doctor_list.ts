import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import axios from 'axios';

interface Doctor {
  username: string;
  title: string;
}

@Component({
  selector: 'doctor-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          class="bg-white rounded-lg shadow p-4"
          *ngFor="let doctor of doctors"
        >
          <h2 class="text-xl font-bold mb-2">{{ doctor.username }}</h2>
          <p class="text-gray-600">{{ doctor.title }}</p>
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
          };
          this.doctors.push(doctor);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
