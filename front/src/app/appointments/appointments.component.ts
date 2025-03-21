import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="calendar-container">
      <h2 class="title">Calendario de Citas</h2>
      <div class="calendar">
        <div class="calendar-header">
          <div class="time-column"></div>
          <div class="day-column" *ngFor="let day of weekDays">
            {{ day | date:'EEE dd/MM' }}
          </div>
        </div>
        <div class="calendar-body">
          <div class="time-slot" *ngFor="let time of timeSlots">
            <div class="time-label">{{ time }}</div>
            <div
              class="slot"
              *ngFor="let day of weekDays"
              [class.taken]="isSlotTaken(day, time)"
              [class.selected]="selectedSlot?.date?.toDateString() === day.toDateString() && selectedSlot?.time === time"
              (click)="isSlotTaken(day, time) ? onSlotClick(day, time) : selectSlot(day, time)"
            >
              <span *ngIf="isSlotTaken(day, time)">Ocupado</span>
            </div>
          </div>
        </div>
      </div>

      <div class="appointment-form" *ngIf="selectedSlot">
        <h3>Nueva Cita para {{ selectedSlot.date | date:'dd/MM/yyyy' }} - {{ selectedSlot.time }}</h3>
        <p><strong>Paciente:</strong> {{ userService.getUser()?.username }}</p>
        <form (ngSubmit)="submitAppointment()">
          <div class="form-group">
            <label for="doctor2">Doctor</label>
            <select id="doctor2" [(ngModel)]="appointment.doctor" name="doctor" required>
              <option value="">Seleccione un doctor</option>
              <option *ngFor="let d of doctors" [value]="d._id">{{ d.username }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reason2">Motivo de la consulta</label>
            <textarea id="reason2" [(ngModel)]="appointment.reason" name="reason" required></textarea>
          </div>
          <div class="button-group">
            <button type="submit" class="submit-btn">Confirmar Cita</button>
            <button type="button" class="cancel-btn" (click)="resetForm()">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="appointment-form" *ngIf="selectedAppointment">
        <h3>Completar Cita - {{ selectedAppointment.reason }}</h3>
        <form (ngSubmit)="completeAppointment()">
          <div class="form-group">
            <label>Diagnóstico</label>
            <textarea [(ngModel)]="result.diagnosis" name="diagnosis" required></textarea>
          </div>
          <div class="form-group">
            <label>Exámenes</label>
            <textarea [(ngModel)]="result.exams" name="exams"></textarea>
          </div>
          <div class="form-group">
            <label>Medicinas</label>
            <textarea [(ngModel)]="result.medicines" name="medicines"></textarea>
          </div>
          <div class="form-group">
            <label>Siguientes pasos</label>
            <textarea [(ngModel)]="result.next_steps" name="next_steps"></textarea>
          </div>
          <div class="button-group">
            <button type="submit" class="submit-btn">Guardar Resultados</button>
            <button type="button" class="cancel-btn" (click)="selectedAppointment = null">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 2rem;
    }
    .calendar {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: auto;
    }
    .calendar-header {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      background-color: #f8f9fa;
      border-bottom: 1px solid #ddd;
    }
    .day-column, .time-label {
      padding: 1rem;
      text-align: center;
      font-weight: bold;
    }
    .calendar-body {
      display: flex;
      flex-direction: column;
    }
    .time-slot {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      border-bottom: 1px solid #eee;
    }
    .slot {
      border-left: 1px solid #eee;
      padding: 0.5rem;
      min-height: 40px;
      cursor: pointer;
    }
    .slot:hover:not(.taken) {
      background-color: #e3f2fd;
    }
    .slot.taken {
      background-color: #a52019 !important;
      cursor: not-allowed;
      pointer-events: none;
    }
    .slot.selected {
      background-color: #bbdefb;
    }
    .appointment-form {
      margin-top: 2rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    /* Style appointment form */
    .appointment-form form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .appointment-form .form-group {
      display: flex;
      flex-direction: column;
    }
    .appointment-form label {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .appointment-form input,
    .appointment-form select,
    .appointment-form textarea {
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 0.75rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .appointment-form input:focus,
    .appointment-form select:focus,
    .appointment-form textarea:focus {
      border-color: #3498db;
      outline: none;
    }
    .appointment-form .button-group {
      grid-column: 1 / -1;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }
    .submit-btn {
      background-color: #3498db !important;
      color: #fff !important;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .cancel-btn {
      background-color: #e74c3c !important;
      color: #fff !important;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .submit-btn:hover {
      background-color: #217dbb !important;
    }
    .cancel-btn:hover {
      background-color: #c0392b !important;
    }
    @media (max-width: 640px) {
      .appointment-form form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointment = { doctor: '', date: '', time: '', reason: '' };
  selectedAppointment: any = null;
  result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };

  role = '';
  currentUserId = '';

  doctors: any[] = [];
  appointments: any[] = [];
  selectedSlot: { date: Date; time: string } | null = null;
  weekDays: Date[] = [];
  timeSlots = [
    '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM',
    '11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM',
    '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'
  ];
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, public userService: UserService) {}

  ngOnInit(): void {
    this.initializeWeekDays();
    this.role = this.userService.getUser()?.rol ?? '';
    this.currentUserId = this.userService.getUser()?._id ?? '';
    this.loadDoctors();
    this.loadAppointments();
  }

  initializeWeekDays(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      this.weekDays.push(day);
    }
  }

  loadDoctors(): void {
    if (this.role === 'doctor') {
      this.doctors = [{ _id: this.currentUserId, username: this.userService.getUser()?.username }];
    } else {
      this.http.get<{ doctors: any[] }>(`${this.baseUrl}/doctors`)
        .subscribe(r => this.doctors = r.doctors || []);
      this.http.get<{ services: any[] }>(`${this.baseUrl}/api/services/`)
        .subscribe(r => {
          const servicesAsDoctors = r.services.map(s => ({ _id: s._id!, username: s.name }));
          this.doctors = [...this.doctors, ...servicesAsDoctors];
        });
    }
  }

  loadAppointments(): void {
    this.http.get<{ appointments: any[] }>(`${this.baseUrl}/api/appointments/`)
      .subscribe(r => {
        const all = r.appointments || [];
        this.appointments = this.role === 'doctor'
          ? all.filter(a => a.doctor._id === this.currentUserId)
          : all;
      });
  }

  isSlotTaken(day: Date, time: string): boolean {
    const [timePart, period] = time.split(' ');
    const [hour, minute] = timePart.split(':').map(Number);
    let h24 = (period === 'PM' && hour < 12) ? hour + 12 : (period === 'AM' && hour === 12 ? 0 : hour);
    const time24 = `${h24.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
    
    return this.appointments.some(appt => {
      const startStr = appt.start as string | undefined;
      if (!startStr) return false;
      const date = new Date(startStr);
      return date.getFullYear() === day.getFullYear() &&
             date.getMonth() === day.getMonth() &&
             date.getDate() === day.getDate() &&
             date.toTimeString().slice(0,5) === time24;
    });
  }

  selectSlot(day: Date, time: string): void {
    this.selectedSlot = { date: day, time };
    const year = day.getFullYear();
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const date = day.getDate().toString().padStart(2, '0');
    this.appointment.date = `${year}-${month}-${date}`;
    this.appointment.time = time;
  }

  onSlotClick(day: Date, time: string): void {
    if (this.role === 'doctor' && this.isSlotTaken(day, time)) {
      const appt = this.appointments.find(a => {
        const d = new Date(a.start);
        return d.toDateString() === day.toDateString() && d.toTimeString().slice(0,5) === this.convertTo24(time);
      });
      if (appt) {
        this.selectedSlot = null;
        this.selectedAppointment = appt;
        this.result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };
      }
    }
  }

  convertTo24(time: string): string {
    const [timePart, period] = time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
  }

  completeAppointment(): void {
    if (!this.selectedAppointment) return;
    const id = this.selectedAppointment._id;
    this.http.put(`${this.baseUrl}/api/appointments/${id}/complete/`, this.result)
      .subscribe(() => {
        this.loadAppointments();
        this.selectedAppointment = null;
      });
  }

  submitAppointment(): void {
    if (!this.appointment.doctor) {
      alert('Debe seleccionar un doctor');
      return;
    }
    const patientId = this.userService.getUser()?._id ?? '';
    let [timePart, period] = this.appointment.time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const payload = { 
      doctor: this.appointment.doctor,
      date: this.appointment.date,
      time: time24,
      reason: this.appointment.reason,
      patient: patientId
    };

    console.log(payload)
    this.http.post(`${this.baseUrl}/api/appointments/create/`, payload)
      .subscribe(() => {
        this.loadAppointments();
        this.resetForm();
      });
  }

  resetForm(): void {
    this.selectedSlot = null;
    this.appointment = { doctor: '', date: '', time: '', reason: '' };
  }
}