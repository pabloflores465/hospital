import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  specialties: string[] = ['Cardiología', 'Dermatología', 'Neurología'];
  
  appointment: any = {};

  newAppointment: any = {};

  selectedSlot: { date: Date, time: string } | null = null;

  weekDays: Date[] = [];

  timeSlots: string[] = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  ngOnInit() {
    this.initializeWeekDays();
  }

  initializeWeekDays() {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      this.weekDays.push(day);
    }
  }

  isSlotTaken(day: Date, time: string): boolean {
    // Implement the logic to check if the slot is taken
    return false; // Placeholder implementation
  }

  submitAppointment() {
    console.log('Cita agendada:', this.appointment);
    // Aquí iría la lógica para enviar la cita al backend
    this.resetForm();
  }

  selectSlot(day: Date, time: string) {
    this.selectedSlot = { date: day, time: time };
  }

  resetForm() {
    this.selectedSlot = null;
    this.newAppointment = {};
  }
}
