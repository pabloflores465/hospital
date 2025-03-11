import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  active: boolean;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  isEditing: boolean = false;
  showForm: boolean = false;
  
  newDoctor: Doctor = {
    id: 0,
    name: '',
    specialty: '',
    email: '',
    phone: '',
    active: true
  };

  specialties: string[] = [
    'Cardiología',
    'Dermatología',
    'Pediatría',
    'Neurología',
    'Medicina General'
  ];

  ngOnInit() {
    // Aquí cargarías los doctores desde tu backend
    this.loadMockDoctors();
  }

  loadMockDoctors() {
    this.doctors = [
      { id: 1, name: 'Dr. Juan Pérez', specialty: 'Cardiología', email: 'juan@hospital.com', phone: '123-456-7890', active: true },
      { id: 2, name: 'Dra. María García', specialty: 'Pediatría', email: 'maria@hospital.com', phone: '123-456-7891', active: true }
    ];
  }

  addDoctor() {
    if (this.isEditing) {
      const index = this.doctors.findIndex(d => d.id === this.newDoctor.id);
      if (index !== -1) {
        this.doctors[index] = {...this.newDoctor};
      }
    } else {
      this.newDoctor.id = this.doctors.length + 1;
      this.doctors.push({...this.newDoctor});
    }
    this.resetForm();
  }

  editDoctor(doctor: Doctor) {
    this.isEditing = true;
    this.showForm = true;
    this.newDoctor = {...doctor};
  }

  deleteDoctor(id: number) {
    if (confirm('¿Está seguro de eliminar este doctor?')) {
      this.doctors = this.doctors.filter(d => d.id !== id);
    }
  }

  resetForm() {
    this.isEditing = false;
    this.showForm = false;
    this.newDoctor = {
      id: 0,
      name: '',
      specialty: '',
      email: '',
      phone: '',
      active: true
    };
  }
}
