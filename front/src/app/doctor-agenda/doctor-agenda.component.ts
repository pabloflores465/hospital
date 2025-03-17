import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  details: string;
}

@Component({
  selector: 'app-doctor-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-agenda.component.html',
  styleUrls: ['./doctor-agenda.component.css']
})
export class DoctorAgendaComponent implements OnInit {
  date: Date = new Date();
  timeSlots: string[] = [];
  appointments: Appointment[] = [];
  selectedSlot: string | null = null;
  
  ngOnInit(): void {
    this.generateTimeSlots();
    // Simulación de citas programadas
    this.appointments = [
      { id: 1, patientName: 'Paciente 1', time: '09:00 AM', details: 'Consulta general' },
      { id: 2, patientName: 'Paciente 2', time: '10:30 AM', details: 'Revisión' }
    ];
  }
  
  generateTimeSlots(): void {
    const startHour = 8; // 8 AM
    const endHour = 18;  // 6 PM
    this.timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      ['00', '30'].forEach(minute => {
        const hr = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const time = `${hr}:${minute} ${period}`;
        this.timeSlots.push(time);
      });
    }
  }
  
  getAppointment(time: string): Appointment | null {
    return this.appointments.find(app => app.time === time) || null;
  }
  
  selectSlot(time: string): void {
    this.selectedSlot = time;
    // Aquí se podría abrir un formulario modal para editar o agendar la cita
    console.log('Slot seleccionado:', time);
  }
}
