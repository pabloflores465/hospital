import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  details: string;
  start: string;
}

@Component({
  selector: 'app-doctor-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agenda-container">
      <h2>Mis Citas Pendientes</h2>
      <ul>
        <li *ngFor="let appt of appointments" (click)="selectAppointment(appt)" class="appointment-item">
          {{ appt.patientName }} — {{ appt.time }} — {{ appt.details }} — {{ appt.start | date:'fullDate' }}
        </li>
      </ul>

      <div class="appointment-form" *ngIf="selectedAppointment">
        <h3>Completar Cita</h3>
        <p><strong>Paciente:</strong> {{ selectedAppointment.patientName }}</p>
        <p><strong>Doctor:</strong> {{ userService.getUser()?.username }}</p>
        <p><strong>Descripción:</strong> {{ selectedAppointment.details }}</p>
        <form (ngSubmit)="completeAppointment()" class="form-card">
          <div class="form-group">
            <label>Diagnóstico</label>
            <textarea [(ngModel)]="result.diagnosis" name="diagnosis" required rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Exámenes</label>
            <textarea [(ngModel)]="result.exams" name="exams" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Medicinas</label>
            <textarea [(ngModel)]="result.medicines" name="medicines" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Siguientes pasos</label>
            <textarea [(ngModel)]="result.next_steps" name="next_steps" rows="2"></textarea>
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">Guardar Resultados</button>
            <button type="button" class="btn btn-secondary" (click)="selectedAppointment = null">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .agenda-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .appointment-item {
      cursor: pointer;
      padding: 0.5rem;
      border-bottom: 1px solid #ddd;
    }
    .appointment-item:hover {
      background-color: #f0f8ff;
    }
    .appointment-form {
      margin-top: 2rem;
    }
    .form-card {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .form-group label {
      font-weight: 600;
      margin-bottom: .5rem;
      display: block;
    }
    .form-group textarea {
      width: 100%;
      padding: .75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .button-group {
      margin-top: 1rem;
      display: flex;
      gap: .5rem;
    }
    .btn {
      padding: .5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-primary {
      background-color: #3498db;
      color: #fff;
    }
    .btn-secondary {
      background-color: #e74c3c;
      color: #fff;
    }
    .btn-primary:hover {
      background-color: #217dbb;
    }
    .btn-secondary:hover {
      background-color: #c0392b;
    }
  `]
})
export class DoctorAgendaComponent implements OnInit {
  weekDays: Date[] = [];
  date: Date = new Date();
  timeSlots: string[] = [];
  appointments: Appointment[] = [];
  selectedSlot: string | null = null;
  selectedAppointment: Appointment | null = null;
  result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, public userService: UserService) {}

  ngOnInit(): void {
    this.generateTimeSlots();
    this.initializeWeekDays();
    this.loadAppointments();
  }

  generateTimeSlots(): void {
    const startHour = 8;
    const endHour = 18;
    this.timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      ['00', '30'].forEach(minute => {
        const hr = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        this.timeSlots.push(`${hr}:${minute} ${period}`);
      });
    }
  }

  initializeWeekDays(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      this.weekDays.push(day);
    }
  }

  loadAppointments(): void {
    const doctorId = this.userService.getUser()?._id;
    this.http.get<{appointments:any[]}>(`${this.baseUrl}/api/appointments/`)
      .subscribe(r => {
        this.appointments = r.appointments
          .filter(a => a.doctor === doctorId && !a.completed)
          .map(a => ({
            id: a._id,
            patientName: a.patient.username,
            time: new Date(a.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
            details: a.details,
            start: a.start
          }));
      });
  }

  isOccupied(day: Date, time: string): boolean {
    return this.appointments.some(a =>
      new Date(a.start).toDateString() === day.toDateString() && a.time === time
    );
  }

  getAppointment(day: Date, time: string): Appointment | null {
    return this.appointments.find(a =>
      new Date(a.start).toDateString() === day.toDateString() && a.time === time
    ) || null;
  }

  selectAppointment(appt: Appointment): void {
    this.selectedAppointment = appt;
  }

  completeAppointment(): void {
    if (!this.selectedAppointment) return;
    const id = this.selectedAppointment?.id;
    this.http.put(`${this.baseUrl}/api/appointments/${id}/complete/`, this.result)
      .subscribe({
        next: () => {
          alert('Resultados guardados correctamente');
          this.loadAppointments();
          this.selectedAppointment = null;
        },
        error: err => alert('Error al guardar resultados: ' + err.error?.error)
      });
  }
}
