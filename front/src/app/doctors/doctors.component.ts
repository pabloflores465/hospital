import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../services/doctor.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  isEditing = signal(false);
  showForm = signal(false);
  errorMessage = signal('');
  loading = signal(false);
  
  newDoctor: Partial<Doctor> = {
    username: '',
    email: '',
    rol: 'doctor',
    noLicencia: ''
  };

  specialties: string[] = [
    'Cardiología',
    'Dermatología',
    'Pediatría',
    'Neurología',
    'Medicina General'
  ];

  constructor(private doctorService: DoctorService) {}

  async ngOnInit() {
    await this.loadDoctors();
  }

  async loadDoctors() {
    try {
      this.loading.set(true);
      this.doctors = await this.doctorService.getDoctors();
    } catch (error) {
      console.error('Error al cargar doctores:', error);
      this.errorMessage.set('Error al cargar la lista de doctores');
    } finally {
      this.loading.set(false);
    }
  }

  async addDoctor() {
    try {
      this.loading.set(true);
      if (this.isEditing()) {
        await this.doctorService.updateDoctor(this.newDoctor._id!, this.newDoctor);
      }
      await this.loadDoctors();
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar doctor:', error);
      this.errorMessage.set('Error al guardar los cambios');
    } finally {
      this.loading.set(false);
    }
  }

  async editDoctor(doctor: Doctor) {
    this.isEditing.set(true);
    this.showForm.set(true);
    this.newDoctor = {...doctor};
  }

  async deleteDoctor(id: string) {
    if (confirm('¿Está seguro de eliminar este doctor?')) {
      try {
        this.loading.set(true);
        await this.doctorService.deleteDoctor(id);
        await this.loadDoctors();
      } catch (error) {
        console.error('Error al eliminar doctor:', error);
        this.errorMessage.set('Error al eliminar el doctor');
      } finally {
        this.loading.set(false);
      }
    }
  }

  resetForm() {
    this.isEditing.set(false);
    this.showForm.set(false);
    this.newDoctor = {
      username: '',
      email: '',
      rol: 'doctor',
      noLicencia: ''
    };
  }
}
