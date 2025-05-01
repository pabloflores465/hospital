import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { back_url } from '../../environments/back_url';
import { UserService } from '../services/user.service';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  time: string;
  details: string;
  start: string;
}

interface Doctor {
  _id: string;
  username: string;
  name?: string;
  email?: string;
}

interface Patient {
  _id: string;
  username: string;
  name?: string;
  email?: string;
}

@Component({
  selector: 'app-doctor-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agenda-container">
      <h2>{{ isStaffUser ? 'Agenda de Doctores' : 'Mi Agenda' }}</h2>
      
      <!-- Selector de doctores para usuarios staff -->
      <div *ngIf="isStaffUser" class="doctor-selector">
        <label for="doctorSelect">Seleccionar Doctor:</label>
        <select 
          id="doctorSelect" 
          [(ngModel)]="selectedDoctorId" 
          (change)="onDoctorChange()" 
          class="doctor-select"
        >
          <option value="">Seleccione un doctor</option>
          <option *ngFor="let doctor of availableDoctors" [value]="doctor._id">
            {{ doctor.name || doctor.username }}
          </option>
        </select>
      </div>

      <!-- Vista de calendario para asignar citas -->
      <div class="calendar-view" *ngIf="isStaffUser">
        <!-- Controles de calendario -->
        <div class="calendar-controls">
          <button class="control-btn" (click)="previousWeek()">
            &laquo; Semana anterior
          </button>
          <span class="current-week">
            {{ weekStartDate | date: 'dd/MM/yyyy' }} - {{ weekEndDate | date: 'dd/MM/yyyy' }}
          </span>
          <button class="control-btn" (click)="nextWeek()">
            Semana siguiente &raquo;
          </button>
        </div>
        
        <div class="calendar">
          <div class="calendar-header">
            <div class="time-column"></div>
            <div class="day-column" *ngFor="let day of weekDays">
              {{ day | date : 'EEE dd/MM' }}
            </div>
          </div>
          <div class="calendar-body">
            <div class="time-slot" *ngFor="let time of timeSlots">
              <div class="time-label">{{ time }}</div>
              <div
                class="slot"
                *ngFor="let day of weekDays"
                [class.taken]="isSlotTaken(day, time)"
                [class.selected]="
                  selectedSlot?.date?.toDateString() === day.toDateString() &&
                  selectedSlot?.time === time
                "
                (click)="selectCalendarSlot(day, time)"
              >
                <!-- Mostrar citas existentes para ese slot -->
                <div *ngFor="let appt of getAppointmentsForSlot(day, time)" 
                     class="appointment-indicator"
                     [title]="getAppointmentTooltip(appt)">
                  <span class="doctor-name">{{ getPatientName(appt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario para crear nueva cita (como staff) -->
        <div class="appointment-form" *ngIf="selectedSlot && isStaffUser">
          <h3>
            Nueva Cita para {{ selectedSlot.date | date : 'dd/MM/yyyy' }} -
            {{ selectedSlot.time }}
          </h3>
          <form (ngSubmit)="createAppointment()">
            <div class="form-group">
              <label for="patientSelect">Paciente</label>
              <select
                id="patientSelect"
                [(ngModel)]="newAppointment.patientId"
                name="patient"
                required
                class="form-control"
              >
                <option value="">Seleccione un paciente</option>
                <option *ngFor="let patient of availablePatients" [value]="patient._id">
                  {{ patient.name || patient.username }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="reasonInput">Motivo de la consulta</label>
              <textarea
                id="reasonInput"
                [(ngModel)]="newAppointment.reason"
                name="reason"
                required
                class="form-control"
                rows="3"
              ></textarea>
            </div>
            <div class="button-group">
              <button type="submit" class="btn btn-primary">Crear Cita</button>
              <button type="button" class="btn btn-secondary" (click)="cancelNewAppointment()">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Lista de citas pendientes -->
      <div *ngIf="appointments.length > 0" class="appointments-list">
        <h3>{{ isStaffUser ? 'Citas pendientes del doctor' : 'Citas pendientes' }}</h3>
        <div
          *ngFor="let appt of appointments"
          class="appointment-item"
          (click)="selectAppointment(appt)"
        >
          <strong>{{ appt.time }}</strong> - {{ appt.patientName }} ({{
            appt.details
          }})
        </div>
      </div>
      <div *ngIf="appointments.length === 0 && !loading">
        <p>{{ isStaffUser && !selectedDoctorId ? 'Seleccione un doctor para ver sus citas' : 'No hay citas pendientes.' }}</p>
      </div>
      <div *ngIf="loading">
        <p>Cargando...</p>
      </div>

      <!-- Formulario para completar cita -->
      <div *ngIf="selectedAppointment" class="appointment-form">
        <h3>Completar Cita con {{ selectedAppointment.patientName }}</h3>
        <div class="form-card">
          <form (ngSubmit)="completeAppointment()">
            <div class="form-group">
              <label>Diagnóstico</label>
              <textarea
                [(ngModel)]="result.diagnosis"
                name="diagnosis"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Exámenes</label>
              <textarea
                [(ngModel)]="result.exams"
                name="exams"
                rows="2"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Siguientes pasos</label>
              <textarea
                [(ngModel)]="result.next_steps"
                name="next_steps"
                rows="2"
              ></textarea>
            </div>
            <div class="button-group">
              <button type="submit" class="btn btn-primary">
                Guardar resultados y generar receta
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                (click)="selectedAppointment = null"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .agenda-container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        display: block;
      }
      .form-group textarea, .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .button-group {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
      }
      .btn {
        padding: 0.5rem 1rem;
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
      .doctor-selector {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f5f8fa;
        border-radius: 6px;
        border: 1px solid #e1e8ed;
      }
      .doctor-select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-top: 0.5rem;
        font-size: 1rem;
      }
      /* Estilos para el calendario */
      .calendar-view {
        margin-top: 2rem;
        margin-bottom: 2rem;
      }
      .calendar-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .control-btn {
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
      }
      .control-btn:hover {
        background-color: #217dbb;
      }
      .current-week {
        font-weight: bold;
      }
      .calendar {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: auto;
        height: 600px;
      }
      .calendar-header {
        display: grid;
        grid-template-columns: 80px repeat(7, 1fr);
        background-color: #f8f9fa;
        border-bottom: 1px solid #ddd;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .day-column,
      .time-label {
        padding: 0.5rem;
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
        padding: 0.3rem;
        min-height: 30px;
        cursor: pointer;
        position: relative;
      }
      .slot:hover {
        background-color: #e3f2fd;
      }
      .slot.selected {
        background-color: #bbdefb;
      }
      .slot.taken {
        background-color: #ffebee;
      }
      .appointment-indicator {
        background-color: #3498db;
        color: white;
        border-radius: 3px;
        padding: 2px 4px;
        margin-bottom: 2px;
        font-size: 0.8rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .appointments-list {
        margin-top: 2rem;
        border-top: 1px solid #ddd;
        padding-top: 1rem;
      }
    `,
  ],
})
export class DoctorAgendaComponent implements OnInit {
  weekDays: Date[] = [];
  date: Date = new Date();
  timeSlots: string[] = [];
  appointments: Appointment[] = [];
  selectedSlot: { date: Date; time: string } | null = null;
  selectedAppointment: Appointment | null = null;
  result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };
  
  // Nuevas propiedades para la funcionalidad de staff
  isStaffUser: boolean = false;
  availableDoctors: Doctor[] = [];
  availablePatients: Patient[] = [];
  selectedDoctorId: string = '';
  loading: boolean = false;
  weekStartDate: Date = new Date();
  weekEndDate: Date = new Date();
  
  // Propiedades para nueva cita
  newAppointment = {
    patientId: '',
    reason: ''
  };

  constructor(
    private http: HttpClient, 
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.generateTimeSlots();
    this.initializeWeekDays();
    
    // Determinar si el usuario es staff
    const userRole = this.userService.getUser()?.rol.toLowerCase();
    this.isStaffUser = userRole === 'staff';
    
    if (this.isStaffUser) {
      // Si es staff, cargar lista de doctores disponibles
      this.loadDoctors();
      // Y también cargar lista de pacientes
      this.loadPatients();
    } else {
      // Si es doctor, cargar sus propias citas
      this.loadAppointments();
    }
  }

  async loadDoctors(): Promise<void> {
    const url = await back_url();
    this.loading = true;
    
    try {
      // Obtener lista de doctores
      this.http.get<{ doctors: Doctor[] }>(`${url}/doctors`).subscribe({
        next: (response) => {
          this.availableDoctors = response.doctors || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar la lista de doctores:', error);
          this.loading = false;
          
          // Cargar doctores desde una ruta alternativa si falla
          this.http.get<{ users: Doctor[] }>(`${url}/users`).subscribe({
            next: (response) => {
              // Filtrar solo los usuarios con rol de doctor
              this.availableDoctors = (response.users || []).filter(
                (user: any) => user.rol?.toLowerCase() === 'doctor'
              );
            },
            error: (fallbackError) => {
              console.error('Error al cargar doctores (método alternativo):', fallbackError);
              alert('No se pudo cargar la lista de doctores. Por favor, intente nuevamente más tarde.');
            }
          });
        }
      });
    } catch (error) {
      console.error('Error en loadDoctors:', error);
      this.loading = false;
    }
  }

  async loadPatients(): Promise<void> {
    const url = await back_url();
    
    try {
      // Cargar lista de pacientes para asignar citas
      this.http.get<{ users: Patient[] }>(`${url}/users`).subscribe({
        next: (response) => {
          // Filtrar solo los usuarios con rol paciente
          this.availablePatients = (response.users || []).filter(
            (user: any) => user.rol?.toLowerCase() === 'patient' || user.rol?.toLowerCase() === 'paciente'
          );
        },
        error: (error) => {
          console.error('Error al cargar la lista de pacientes:', error);
          alert('No se pudo cargar la lista de pacientes. Algunas funciones pueden no estar disponibles.');
        }
      });
    } catch (error) {
      console.error('Error en loadPatients:', error);
    }
  }

  onDoctorChange(): void {
    if (this.selectedDoctorId) {
      this.loadAppointmentsByDoctorId(this.selectedDoctorId);
    } else {
      // Limpiar las citas si no se selecciona ningún doctor
      this.appointments = [];
    }
  }

  async loadAppointmentsByDoctorId(doctorId: string): Promise<void> {
    const url = await back_url();
    this.loading = true;
    
    this.http
      .get<{ appointments: any[] }>(`${url}/api/appointments/doctor/${doctorId}/`)
      .subscribe({
        next: (response) => {
          this.appointments = (response.appointments || [])
            .filter((a) => !a.completed)
            .map((a) => ({
              id: a._id,
              patientName: a.patient.username || 'Paciente',
              patientId: a.patient._id,
              time: new Date(a.start).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              details: a.details || 'Sin detalles',
              start: a.start,
            }));
          this.loading = false;
        },
        error: (error) => {
          console.error(`Error al cargar citas del doctor ${doctorId}:`, error);
          this.loading = false;
          
          // Como alternativa, cargar todas las citas y filtrar por doctor
          this.loadAllAppointmentsAndFilter(doctorId);
        }
      });
  }

  private async loadAllAppointmentsAndFilter(doctorId: string): Promise<void> {
    const url = await back_url();
    
    this.http
      .get<{ appointments: any[] }>(`${url}/api/appointments/`)
      .subscribe({
        next: (response) => {
          this.appointments = (response.appointments || [])
            .filter((a) => a.doctor === doctorId && !a.completed)
            .map((a) => ({
              id: a._id,
              patientName: a.patient.username || 'Paciente',
              patientId: a.patient._id,
              time: new Date(a.start).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              details: a.details || 'Sin detalles',
              start: a.start,
            }));
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar todas las citas:', error);
          this.loading = false;
          alert('No se pudieron cargar las citas del doctor seleccionado.');
        }
      });
  }

  generateTimeSlots(): void {
    const startHour = 8;
    const endHour = 18;
    this.timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      ['00', '30'].forEach((minute) => {
        const hr = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        this.timeSlots.push(`${hr}:${minute} ${period}`);
      });
    }
  }

  initializeWeekDays(): void {
    const today = new Date();
    this.weekDays = [];
    this.weekStartDate = new Date(today);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      this.weekDays.push(day);
    }
    
    this.weekEndDate = new Date(this.weekDays[6]);
  }

  previousWeek(): void {
    const firstDay = new Date(this.weekDays[0]);
    firstDay.setDate(firstDay.getDate() - 7);
    this.weekDays = [];
    this.weekStartDate = new Date(firstDay);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      this.weekDays.push(day);
    }
    
    this.weekEndDate = new Date(this.weekDays[6]);
  }

  nextWeek(): void {
    const firstDay = new Date(this.weekDays[0]);
    firstDay.setDate(firstDay.getDate() + 7);
    this.weekDays = [];
    this.weekStartDate = new Date(firstDay);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      this.weekDays.push(day);
    }
    
    this.weekEndDate = new Date(this.weekDays[6]);
  }

  async loadAppointments(): Promise<void> {
    const url = await back_url();
    const userId = this.userService.getUser()?._id;
    this.loading = true;
    
    this.http
      .get<{ appointments: any[] }>(`${url}/api/appointments/`)
      .subscribe({
        next: (response) => {
          this.appointments = (response.appointments || [])
            .filter((a) => a.doctor === userId && !a.completed)
            .map((a) => ({
              id: a._id,
              patientName: a.patient.username || 'Paciente',
              patientId: a.patient._id,
              time: new Date(a.start).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              details: a.details || 'Sin detalles',
              start: a.start,
            }));
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar citas:', error);
          this.loading = false;
          alert('Error al cargar las citas. Por favor, intente nuevamente más tarde.');
        }
      });
  }

  getAppointmentsForSlot(day: Date, time: string): any[] {
    if (!this.selectedDoctorId || !this.appointments.length) return [];
    
    // Convertir a formato 24 horas para comparación
    const [timePart, period] = time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    return this.appointments.filter((appt) => {
      const startDate = new Date(appt.start);
      const appointmentTime = startDate.toTimeString().slice(0, 5); // HH:MM format
      
      return (
        startDate.getFullYear() === day.getFullYear() &&
        startDate.getMonth() === day.getMonth() &&
        startDate.getDate() === day.getDate() &&
        appointmentTime === time24
      );
    });
  }

  isSlotTaken(day: Date, time: string): boolean {
    return this.getAppointmentsForSlot(day, time).length > 0;
  }

  getPatientName(appointment: any): string {
    return appointment.patientName || 'Paciente';
  }

  getAppointmentTooltip(appointment: any): string {
    return `Paciente: ${appointment.patientName || 'Desconocido'}
Detalles: ${appointment.details || 'Sin detalles'}
Hora: ${appointment.time}`;
  }

  selectCalendarSlot(day: Date, time: string): void {
    if (!this.selectedDoctorId) {
      alert('Por favor, seleccione un doctor primero');
      return;
    }
    
    this.selectedSlot = { date: day, time };
    this.newAppointment = {
      patientId: '',
      reason: ''
    };
  }

  cancelNewAppointment(): void {
    this.selectedSlot = null;
  }

  async createAppointment(): Promise<void> {
    if (!this.selectedSlot || !this.selectedDoctorId || !this.newAppointment.patientId || !this.newAppointment.reason) {
      alert('Por favor complete todos los campos');
      return;
    }

    // Convertir la hora a formato 24 horas para la API
    const [timePart, period] = this.selectedSlot.time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    // Crear una fecha para la cita completa
    const appointmentDate = new Date(this.selectedSlot.date);
    appointmentDate.setHours(hour);
    appointmentDate.setMinutes(minute);

    const url = await back_url();
    this.loading = true;
    
    this.http
      .post(`${url}/api/appointments/create/`, {
        doctor: this.selectedDoctorId,
        patient: this.newAppointment.patientId,
        start: appointmentDate.toISOString(),
        details: this.newAppointment.reason,
      })
      .subscribe({
        next: () => {
          alert('Cita creada correctamente');
          this.loading = false;
          this.selectedSlot = null;
          this.loadAppointmentsByDoctorId(this.selectedDoctorId);
        },
        error: (error) => {
          console.error('Error al crear cita:', error);
          this.loading = false;
          alert('Error al crear la cita: ' + (error.error?.error || 'Error desconocido'));
        }
      });
  }

  isOccupied(day: Date, time: string): boolean {
    return this.appointments.some(
      (a) =>
        new Date(a.start).toDateString() === day.toDateString() &&
        a.time === time
    );
  }

  getAppointment(day: Date, time: string): Appointment | null {
    return (
      this.appointments.find(
        (a) =>
          new Date(a.start).toDateString() === day.toDateString() &&
          a.time === time
      ) || null
    );
  }

  selectAppointment(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };
  }

  async completeAppointment(): Promise<void> {
    if (!this.selectedAppointment) return;

    const url = await back_url();
    this.loading = true;
    
    this.http
      .post(`${url}/api/appointments/${this.selectedAppointment.id}/complete/`, {
        diagnosis: this.result.diagnosis,
        exams: this.result.exams,
        medicines: this.result.medicines,
        next_steps: this.result.next_steps,
      })
      .subscribe({
        next: () => {
          alert('Cita completada correctamente');
          this.loading = false;
          this.selectedAppointment = null;
          
          const userRole = this.userService.getUser()?.rol.toLowerCase();
          
          if (this.isStaffUser && this.selectedDoctorId) {
            // Si es staff, recargar las citas del doctor seleccionado
            this.loadAppointmentsByDoctorId(this.selectedDoctorId);
          } else if (userRole === 'doctor') {
            // Si es doctor, redirigir a la página de recetas
            this.router.navigate(['/doctor/prescriptions/new']);
          } else {
            // En otro caso, recargar sus propias citas
            this.loadAppointments();
          }
        },
        error: (error) => {
          console.error('Error al completar la cita', error);
          this.loading = false;
          alert('Error al completar la cita');
        }
      });
  }
}
