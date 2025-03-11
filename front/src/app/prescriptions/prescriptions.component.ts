import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Patient {
  id: number;
  name: string;
  lastAppointment: Date;
}

interface Prescription {
  id: number;
  patientId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  date: Date;
}

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescriptions.component.html',
  styleUrls: ['./prescriptions.component.css']
})
export class PrescriptionsComponent implements OnInit {
  patients: Patient[] = [];
  prescriptions: Prescription[] = [];
  selectedPatient: Patient | null = null;
  
  newPrescription: Prescription = {
    id: 0,
    patientId: 0,
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    date: new Date()
  };

  ngOnInit() {
    // Simulación de datos
    this.loadMockData();
  }

  loadMockData() {
    this.patients = [
      { id: 1, name: 'Juan Pérez', lastAppointment: new Date('2024-01-15') },
      { id: 2, name: 'María García', lastAppointment: new Date('2024-01-16') }
    ];

    this.prescriptions = [
      {
        id: 1,
        patientId: 1,
        medication: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Cada 8 horas',
        duration: '5 días',
        notes: 'Tomar después de las comidas',
        date: new Date()
      }
    ];
  }

  selectPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.newPrescription.patientId = patient.id;
    this.newPrescription.date = new Date();
  }

  submitPrescription() {
    if (!this.selectedPatient) return;

    const prescription: Prescription = {
      ...this.newPrescription,
      id: this.prescriptions.length + 1
    };

    this.prescriptions.push(prescription);
    this.resetForm();
  }

  getPatientPrescriptions(patientId: number): Prescription[] {
    return this.prescriptions.filter(p => p.patientId === patientId);
  }

  resetForm() {
    this.selectedPatient = null;
    this.newPrescription = {
      id: 0,
      patientId: 0,
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
      date: new Date()
    };
  }
}
