import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="calendar-container">
      <h2 class="title">Calendario de Citas</h2>
      
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
              [class.taken]="false"
              [class.selected]="
                selectedSlot?.date?.toDateString() === day.toDateString() &&
                selectedSlot?.time === time
              "
              (click)="selectSlot(day, time)"
            >
              <!-- Mostrar citas existentes para ese slot -->
              <div *ngFor="let appt of getAppointmentsForSlot(day, time)" 
                   class="appointment-indicator"
                   [title]="getAppointmentTooltip(appt)">
                <span class="doctor-name">{{ getDoctorName(appt.doctor) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="appointment-form" *ngIf="selectedSlot">
        <h3>
          Nueva Cita para {{ selectedSlot.date | date : 'dd/MM/yyyy' }} -
          {{ selectedSlot.time }}
        </h3>
        <p><strong>Paciente:</strong> {{ userService.getUser()?.username }}</p>
        <form (ngSubmit)="submitAppointment()">
          <div class="form-group">
            <label for="doctor2">Doctor</label>
            <select
              id="doctor2"
              [(ngModel)]="appointment.doctor"
              name="doctor"
              required
            >
              <option value="">Seleccione un doctor</option>
              <option *ngFor="let d of availableDoctorsForSlot" [value]="d._id">
                {{ d.username }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="reason2">Motivo de la consulta</label>
            <textarea
              id="reason2"
              [(ngModel)]="appointment.reason"
              name="reason"
              required
            ></textarea>
          </div>
          <div class="button-group">
            <button type="submit" class="submit-btn">Confirmar Cita</button>
            <button type="button" class="cancel-btn" (click)="resetForm()">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div class="appointment-form" *ngIf="selectedAppointment">
        <h3>Completar Cita - {{ selectedAppointment.reason }}</h3>
        <form (ngSubmit)="completeAppointment()">
          <div class="form-group">
            <label>Diagnóstico</label>
            <textarea
              [(ngModel)]="result.diagnosis"
              name="diagnosis"
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label>Exámenes</label>
            <textarea [(ngModel)]="result.exams" name="exams"></textarea>
          </div>
          <div class="form-group">
            <label>Medicinas</label>
            <textarea
              [(ngModel)]="result.medicines"
              name="medicines"
            ></textarea>
          </div>
          <div class="form-group">
            <label>Siguientes pasos</label>
            <textarea
              [(ngModel)]="result.next_steps"
              name="next_steps"
            ></textarea>
          </div>
          <div class="button-group">
            <button type="submit" class="submit-btn">Guardar Resultados</button>
            <button
              type="button"
              class="cancel-btn"
              (click)="selectedAppointment = null"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .calendar-container {
        padding: 2rem;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-top: 2rem;
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
      }
      .calendar-header {
        display: grid;
        grid-template-columns: 80px repeat(7, 1fr);
        background-color: #f8f9fa;
        border-bottom: 1px solid #ddd;
      }
      .day-column,
      .time-label {
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
        position: relative;
      }
      .slot:hover {
        background-color: #e3f2fd;
      }
      .slot.selected {
        background-color: #bbdefb;
      }
      .appointment-indicator {
        background-color: #a52019;
        color: white;
        border-radius: 3px;
        padding: 2px 4px;
        margin-bottom: 2px;
        font-size: 0.8rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .doctor-name {
        font-weight: bold;
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
    `,
  ],
})
export class AppointmentsComponent implements OnInit {
  appointment = { doctor: '', date: '', time: '', reason: '' };
  selectedAppointment: any = null;
  result = { diagnosis: '', exams: '', medicines: '', next_steps: '' };

  role = '';
  currentUserId = '';

  doctors: any[] = [];
  appointments: any[] = [];
  availableDoctorsForSlot: any[] = [];
  selectedSlot: { date: Date; time: string } | null = null;
  weekDays: Date[] = [];
  weekStartDate: Date = new Date();
  weekEndDate: Date = new Date();
  
  timeSlots = [
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ];

  constructor(private http: HttpClient, public userService: UserService) {}

  ngOnInit(): void {
    this.initializeWeekDays();
    this.role = this.userService.getUser()?.rol ?? '';
    
    // Verificar que el ID de usuario no sea "magic" u otro valor inválido
    const userId = this.userService.getUser()?._id;
    this.currentUserId = (userId && userId !== 'magic' && userId.trim() !== '') ? userId : '';
    
    // Si estamos en rol doctor pero no tenemos ID válido, intentar obtenerlo del localStorage
    if (this.role === 'doctor' && !this.currentUserId) {
      try {
        const userDataString = localStorage.getItem('hospital_user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData._id && userData._id !== 'magic' && userData._id.trim() !== '') {
            this.currentUserId = userData._id;
            console.log('ID obtenido del localStorage:', this.currentUserId);
          }
        }
      } catch (error) {
        console.error('Error al obtener ID de usuario del localStorage:', error);
      }
    }
    
    this.loadDoctors();
    this.loadAppointments();
  }

  initializeWeekDays(): void {
    this.weekDays = [];
    const today = new Date();
    this.weekStartDate = new Date(today);
    
    // Comenzar desde hoy y mostrar los próximos 7 días
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

  async loadDoctors(): Promise<void> {
    const url = await back_url();
    if (this.role === 'doctor') {
      // Load all doctors for selection even if logged in as doctor
      this.http
        .get<{ doctors: any[] }>(`${url}/doctors`)
        .subscribe(
          (r) =>
            (this.doctors = (r.doctors || []).filter(
              (d) => d._id !== this.currentUserId
            ))
        );
    } else {
      this.http
        .get<{ doctors: any[] }>(`${url}/doctors`)
        .subscribe((r) => (this.doctors = r.doctors || []));
      this.http
        .get<{ services: any[] }>(`${url}/api/services/`)
        .subscribe((r) => {
          const servicesAsDoctors = r.services.map((s) => ({
            _id: s._id!,
            username: s.name,
          }));
          this.doctors = [...this.doctors, ...servicesAsDoctors];
        });
    }
  }

  async loadAppointments(): Promise<void> {
    const url = await back_url();
    
    // Si el usuario es un doctor, cargar citas usando su email desde localStorage
    if (this.role === 'doctor') {
      try {
        // Obtener datos del localStorage y parsearlo correctamente
        const userDataString = localStorage.getItem('hospital_user');
        let doctorEmail = '';
        
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          doctorEmail = userData.email;
          console.log('Doctor email from localStorage:', doctorEmail);
        }
        
        // Verificar si tenemos un email o ID válido
        const doctorIdentifier = doctorEmail || this.currentUserId;
        
        if (doctorIdentifier && doctorIdentifier !== 'magic' && doctorIdentifier.trim() !== '') {
          console.log('Requesting appointments for doctor:', doctorIdentifier);
          this.http
            .get<{ appointments: any[] }>(`${url}/api/appointments/doctor/${doctorIdentifier}/`)
            .subscribe((r) => {
              const all = r.appointments || [];
              console.log('Loaded doctor appointments (raw):', all);
              this.appointments = all;
              console.log('Filtered doctor appointments:', this.appointments);
            }, (error) => {
              console.error('Error loading doctor appointments:', error);
              this.appointments = [];
            });
        } else {
          console.error('No hay un identificador válido para el doctor. Cargando todas las citas.');
          // Si no hay identificador válido, cargar todas las citas como fallback
          this.loadAllAppointments(url);
        }
      } catch (error) {
        console.error('Error processing user data from localStorage:', error);
        this.appointments = [];
        // Si hay error, cargar todas las citas como fallback
        this.loadAllAppointments(url);
      }
    } else {
      // Para pacientes u otros roles, cargar todas las citas
      this.loadAllAppointments(url);
    }
  }

  private loadAllAppointments(url: string): void {
      this.http
        .get<{ appointments: any[] }>(`${url}/api/appointments/`)
        .subscribe((r) => {
          const all = r.appointments || [];
          console.log('Loaded all appointments:', all);
          this.appointments = all;
        
          // Si el usuario es doctor pero estamos cargando todas las citas, mostrar un mensaje
          if (this.role === 'doctor') {
            setTimeout(() => {
              alert('No se pudieron cargar sus citas específicas como doctor. Se están mostrando todas las citas disponibles.');
            }, 1000);
          }
        }, (error) => {
          console.error('Error loading all appointments:', error);
          this.appointments = [];
          
          // Mensaje de error si falla todo
          setTimeout(() => {
            alert('Error al cargar las citas. Por favor, intente nuevamente más tarde.');
          }, 1000);
        });
  }

  getAppointmentsForSlot(day: Date, time: string): any[] {
    const time24 = this.convertTo24(time);
    
    return this.appointments.filter((appt) => {
      const startStr = appt.start as string | undefined;
      if (!startStr) return false;
      const date = new Date(startStr);
      return (
        date.getFullYear() === day.getFullYear() &&
        date.getMonth() === day.getMonth() &&
        date.getDate() === day.getDate() &&
        date.toTimeString().slice(0, 5) === time24
      );
    });
  }

  getDoctorName(doctorId: string): string {
    const doctor = this.doctors.find(d => d._id === doctorId);
    return doctor ? doctor.username : 'Doctor';
  }

  getAppointmentTooltip(appointment: any): string {
    return `Paciente: ${appointment.patient?.username || 'Desconocido'}
Doctor: ${this.getDoctorName(appointment.doctor)}
Motivo: ${appointment.reason || 'No especificado'}`;
  }

  selectSlot(day: Date, time: string): void {
    this.selectedAppointment = null;
    this.selectedSlot = { date: day, time };
    const year = day.getFullYear();
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const date = day.getDate().toString().padStart(2, '0');
    this.appointment.date = `${year}-${month}-${date}`;
    this.appointment.time = time;
    
    // Obtener citas para este slot
    const appointmentsForSlot = this.getAppointmentsForSlot(day, time);
    
    // Obtener doctores que ya tienen cita en este slot
    const doctorsWithAppointments = appointmentsForSlot.map(a => a.doctor);
    
    // Filtrar doctores disponibles (los que no tienen cita en este slot)
    this.availableDoctorsForSlot = this.doctors.filter(d => 
      !doctorsWithAppointments.includes(d._id)
    );
    
    // Si el usuario es doctor y está seleccionado un slot para ver citas
    if (this.role === 'doctor') {
      const appt = appointmentsForSlot.find(a => a.doctor === this.currentUserId);
      if (appt) {
        this.selectedSlot = null;
        this.selectedAppointment = appt;
        this.result = {
          diagnosis: appt.diagnosis || '',
          exams: appt.exams || '',
          medicines: appt.medicines || '',
          next_steps: appt.next_steps || '',
        };
      }
    }
  }

  onSlotClick(day: Date, time: string): void {
    if (this.role === 'doctor') {
      const appointmentsForSlot = this.getAppointmentsForSlot(day, time);
      const appt = appointmentsForSlot.find(a => a.doctor === this.currentUserId);
      if (appt) {
        this.selectedSlot = null;
        this.selectedAppointment = appt;
        this.result = {
          diagnosis: appt.diagnosis || '',
          exams: appt.exams || '',
          medicines: appt.medicines || '',
          next_steps: appt.next_steps || '',
        };
      }
    } else {
      this.selectSlot(day, time);
    }
  }

  convertTo24(time: string): string {
    const [timePart, period] = time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  }

  async completeAppointment(): Promise<void> {
    if (!this.selectedAppointment) return;
    const id = this.selectedAppointment._id;
    const url = await back_url();
    this.http
      .put(`${url}/api/appointments/${id}/complete/`, this.result)
      .subscribe(() => {
        this.loadAppointments();
        this.selectedAppointment = null;
      });
  }

  async submitAppointment(): Promise<void> {
    const url = await back_url();
    if (!this.appointment.doctor) {
      alert('Debe seleccionar un doctor');
      return;
    }
    const patientId = this.userService.getUser()?._id ?? '';
    let [timePart, period] = this.appointment.time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;

    const startDateTime = `${this.appointment.date}T${time24}:00`;
    const payload = {
      doctor: this.appointment.doctor,
      start: startDateTime,
      reason: this.appointment.reason,
      patient: patientId,
    };
    console.log('Submitting appointment payload:', payload);
    this.http.post(`${url}/api/appointments/create/`, payload).subscribe(
      () => {
        this.loadAppointments();
        this.resetForm();
      },
      (error) => {
        console.error('Error creating appointment:', error);
        alert(
          'Error al crear la cita: ' + (error.error.detail || error.statusText)
        );
      }
    );
  }

  resetForm(): void {
    this.selectedSlot = null;
    this.appointment = { doctor: '', date: '', time: '', reason: '' };
  }
}
