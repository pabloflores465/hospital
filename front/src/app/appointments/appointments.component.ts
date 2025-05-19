import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { back_url } from '../../environments/back_url';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';

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
        
        <!-- Si es staff o doctor, mostrar selector de paciente -->
        <div *ngIf="role === 'staff' || role === 'doctor' || role === 'admin'" class="patient-selector">
          <p><strong>Seleccione un paciente:</strong></p>
          <select
            [(ngModel)]="appointment.patient"
            name="patient"
            required
            class="patient-select"
          >
            <option value="">-- Seleccionar paciente --</option>
            <option *ngFor="let patient of patients" [value]="patient._id">
              {{ patient.username || patient.name || 'Sin nombre' }} ({{ patient.identification || patient.email || 'No ID' }})
            </option>
          </select>
          <!-- Mensaje de advertencia si no hay pacientes -->
          <p *ngIf="patients.length === 0" class="warning-message">
            No hay pacientes registrados en el sistema. Por favor, registre pacientes antes de continuar.
          </p>
        </div>
        
        <!-- Para pacientes normales, mostrar su usuario -->
        <p *ngIf="role !== 'staff' && role !== 'doctor' && role !== 'admin'">
          <strong>Paciente:</strong> {{ userService.getUser()?.username || userService.getUser()?.name }}
        </p>
        
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

      <div class="manage-appointments-section" *ngIf="selectTemplate()">
        <h3>Gestión de Citas</h3>
        <p>{{ selectTemplate() }}</p>
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
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
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
        max-height: 600px;
        position: relative;
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
      .appointment-indicator {
        background-color: #a52019;
        color: white;
        border-radius: 3px;
        padding: 2px 4px;
        margin: 1px 0;
        font-size: 0.8rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .doctor-name {
        font-weight: bold;
      }
      .appointment-form {
        margin-top: 2rem;
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f9f9f9;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
      }
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .form-group textarea {
        height: 100px;
        resize: vertical;
      }
      .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .submit-btn {
        background-color: #2ecc71;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
      }
      .submit-btn:hover {
        background-color: #27ae60;
      }
      .cancel-btn {
        background-color: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
      }
      .cancel-btn:hover {
        background-color: #c0392b;
      }
      .manage-appointments-section {
        margin-top: 2rem;
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f9f9f9;
      }
      .patient-selector {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f0f7ff;
        border: 1px solid #cce5ff;
        border-radius: 4px;
      }
      .patient-select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-top: 0.5rem;
        font-size: 1rem;
      }
      .warning-message {
        color: #e74c3c;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background-color: #fdecea;
        border-left: 3px solid #e74c3c;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class AppointmentsComponent implements OnInit {
  appointment: { 
    doctor: string; 
    date: string; 
    time: string; 
    reason: string;
    patient?: string;
  } = { doctor: '', date: '', time: '', reason: '' };
  
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

  // Agregar nueva propiedad para los pacientes
  patients: User[] = [];

  constructor(private http: HttpClient, public userService: UserService) {}

  async ngOnInit(): Promise<void> {
    try {
      // Forzar rol 'staff' si la URL contiene /staff/agenda
      const currentUrl = window.location.href;
      const isStaffAgendaPage = currentUrl.includes('/staff/agenda') || 
                               currentUrl.includes('staff%2Fagenda');
      
      if (isStaffAgendaPage) {
        console.log('Detectada URL de staff agenda, forzando rol staff');
        this.role = 'staff';
        this.currentUserId = this.userService.getUser()?._id || 'staff_user';
      } else {
        // Obtener usuario del servicio
        const user = this.userService.getUser();
        console.log('Usuario obtenido del servicio:', user);
        
        // También verificar localStorage directamente para diagnóstico
        try {
          const storedUserData = localStorage.getItem('hospital_user');
          if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            console.log('Usuario en localStorage:', parsedUser);
            
            // Si no hay usuario del servicio pero sí en localStorage, usar el de localStorage
            if (!user && parsedUser) {
              console.log('Usando usuario de localStorage ya que no hay usuario en el servicio');
              this.role = parsedUser.rol || '';
              this.currentUserId = parsedUser._id || '';
            } else {
              this.role = user?.rol || '';
              this.currentUserId = user?._id || '';
            }
          } else {
            console.log('No hay datos de usuario en localStorage');
            this.role = user?.rol || '';
            this.currentUserId = user?._id || '';
          }
        } catch (e) {
          console.error('Error al leer localStorage:', e);
          this.role = user?.rol || '';
          this.currentUserId = user?._id || '';
        }
      }
      
      // Forzar rol para staff/agenda
      if (isStaffAgendaPage && !this.role) {
        console.warn('Forzando rol "staff" para la página de agenda');
        this.role = 'staff';
      }

      console.log('Rol detectado:', this.role);
      console.log('ID de usuario:', this.currentUserId);

      // Inicializar fechas y días de la semana
      this.initializeWeekDays();

      // Cargar doctores
      await this.loadDoctors();
      console.log(`Doctores cargados: ${this.doctors.length}`);
      
      // Cargar los pacientes del hospital (para staff, doctor o admin)
      if (this.role === 'staff' || this.role === 'doctor' || this.role === 'admin' || isStaffAgendaPage) {
        console.log('Cargando lista de pacientes del hospital');
        await this.loadPatients();
        if (this.patients.length > 0) {
          console.log(`Se cargaron ${this.patients.length} pacientes del hospital`);
        } else {
          console.warn('No se encontraron pacientes en el hospital');
        }
      }

      // Cargar citas existentes
      await this.loadAppointments();
      console.log(`Citas cargadas: ${this.appointments.length}`);

    } catch (error) {
      console.error('Error al inicializar componente de citas:', error);
    }
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
    try {
      console.log('Cargando doctores disponibles');
      
      const url = await back_url();
      console.log('URL de la API:', url);
      
      // Usar el mismo endpoint que utiliza el componente de recetas
      this.http.get<any>(`${url}/users`).subscribe({
        next: (response) => {
          console.log('Respuesta de la API al cargar doctores:', response);
          
          if (response && response.appointments && Array.isArray(response.appointments)) {
            // Filtrar solo usuarios con rol doctor
            const allDoctors = response.appointments.filter(
              (user: any) => user.rol === 'doctor'
            );
            
            // Si es doctor o staff, filtrar para excluirse a sí mismo
            if (this.role === 'doctor') {
              this.doctors = allDoctors.filter((d: any) => d._id !== this.currentUserId);
              console.log('Doctores filtrados (excluyendo al usuario actual):', this.doctors);
            } else {
              this.doctors = allDoctors;
              console.log('Todos los doctores cargados:', this.doctors);
            }
            
          } else {
            console.error('Formato de respuesta inesperado al cargar doctores:', response);
            // Añadir doctores de prueba en caso de error
            this.doctors = [
              {
                _id: '987654321',
                username: 'Dr. Ejemplo',
                name: 'Doctor de Prueba',
                email: 'doctor@test.com',
                rol: 'doctor'
              }
            ];
          }
          
          console.log(`Se cargaron ${this.doctors.length} doctores para selección`);
        },
        error: (error) => {
          console.error('Error al cargar doctores:', error);
          // Añadir doctores de prueba en caso de error
          this.doctors = [
            {
              _id: '987654321',
              username: 'Dr. Ejemplo',
              name: 'Doctor de Prueba',
              email: 'doctor@test.com',
              rol: 'doctor'
            }
          ];
          console.log('Usando doctores de respaldo debido al error');
        }
      });
    } catch (error) {
      console.error('Error al cargar doctores:', error);
      // Añadir doctores de prueba en caso de error
      this.doctors = [
        {
          _id: '987654321',
          username: 'Dr. Ejemplo',
          name: 'Doctor de Prueba',
          email: 'doctor@test.com',
          rol: 'doctor'
        }
      ];
      console.log('Usando doctores de respaldo debido al error');
    }
  }

  async loadAppointments(): Promise<void> {
    const url = await back_url();
    
    // Si el usuario es un doctor o staff, cargar citas usando su email desde localStorage
    if (this.role === 'doctor' || this.role === 'staff') {
      try {
        // Obtener datos del localStorage y parsearlo correctamente
        const userDataString = localStorage.getItem('hospital_user');
        let userEmail = '';
        
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          userEmail = userData.email;
          console.log(`${this.role} email from localStorage:`, userEmail);
        }
        
        // Verificar si tenemos un email o ID válido
        const userIdentifier = userEmail || this.currentUserId;
        
        if (userIdentifier && userIdentifier !== 'magic' && userIdentifier.trim() !== '') {
          console.log(`Requesting appointments for ${this.role}:`, userIdentifier);
          this.http
            .get<{ appointments: any[] }>(`${url}/api/appointments/doctor/${userIdentifier}/`)
            .subscribe((r) => {
              const all = r.appointments || [];
              console.log(`Loaded ${this.role} appointments (raw):`, all);
              this.appointments = all;
              console.log(`Filtered ${this.role} appointments:`, this.appointments);
            }, (error) => {
              console.error(`Error loading ${this.role} appointments:`, error);
              this.appointments = [];
            });
        } else {
          console.error(`No hay un identificador válido para el ${this.role}. Cargando todas las citas.`);
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
        
          // Si el usuario es doctor o staff pero estamos cargando todas las citas, mostrar un mensaje
          if (this.role === 'doctor' || this.role === 'staff') {
            setTimeout(() => {
              alert(`No se pudieron cargar sus citas específicas como ${this.role}. Se están mostrando todas las citas disponibles.`);
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

  async selectSlot(day: Date, time: string): Promise<void> {
    console.log(`Slot seleccionado: ${day.toDateString()} - ${time}`);
    this.selectedSlot = { date: day, time };
    
    const currentTime = time;
    
    // Primero cargar los doctores disponibles para este slot
    this.availableDoctorsForSlot = await this.getDoctorsAvailableForSlot(
      day,
      currentTime
    );
    
    console.log('Doctores disponibles:', this.availableDoctorsForSlot);
    
    // Resetear el formulario pero mantener el slot seleccionado
    this.resetForm();
    this.selectedSlot = { date: day, time: currentTime };
    
    // Determinar el rol de usuario actual
    this.role = this.userService.getUser()?.rol || '';
    this.currentUserId = this.userService.getUser()?._id || '';
    
    console.log('Rol de usuario:', this.role);
    console.log('ID de usuario:', this.currentUserId);
    
    // Verificar si estamos en la página de staff
    const isStaffPage = window.location.href.includes('/staff/agenda') || 
                        window.location.href.includes('staff%2Fagenda');
    
    // Forzar rol staff si estamos en la página de staff/agenda
    if (isStaffPage && this.role !== 'staff') {
      console.log('Forzando rol staff para esta página');
      this.role = 'staff';
    }
    
    // Cargar pacientes si somos staff, doctor o estamos en la página staff/agenda
    if (this.role === 'staff' || this.role === 'doctor' || this.role === 'admin' || isStaffPage) {
      console.log('Cargando pacientes para rol:', this.role);
      await this.loadPatients();
      
      // Inicializar paciente si hay pacientes disponibles
      if (this.patients && this.patients.length > 0) {
        this.appointment.patient = this.patients[0]._id;
        console.log('Paciente inicializado:', this.appointment.patient);
      } else {
        console.warn('No hay pacientes disponibles para seleccionar');
        this.appointment.patient = '';
      }
    } else {
      // Para pacientes normales, usar su propio ID
      this.appointment.patient = this.currentUserId;
      console.log('ID de paciente (auto-asignado):', this.appointment.patient);
    }
    
    // Inicializar doctor si hay disponibles
    if (this.availableDoctorsForSlot.length > 0) {
      this.appointment.doctor = this.availableDoctorsForSlot[0]._id;
    } else {
      this.appointment.doctor = '';
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

  selectTemplate(): string {
    // Determina la plantilla base según el rol del usuario
    if (this.role === 'doctor' || this.role === 'staff') {
      return `
        <div class="manage-appointments-section">
          <h3>Gestión de Citas</h3>
          <p>Como ${this.role}, puedes gestionar citas para pacientes.</p>
          <button class="btn-primary" (click)="showScheduleForm()">Programar Nueva Cita</button>
        </div>
      `;
    }
    return '';
  }

  async submitAppointment(): Promise<void> {
    try {
      console.log('Enviando cita con datos:', this.appointment);
      
      // Verificar si estamos en la página de staff
      const isStaffPage = window.location.href.includes('/staff/agenda') || 
                          window.location.href.includes('staff%2Fagenda');
      
      if (isStaffPage && this.role !== 'staff') {
        console.log('Forzando rol staff para creación de cita');
        this.role = 'staff';
      }
      
      if (!this.selectedSlot) {
        console.error('No hay un horario seleccionado');
        alert('Por favor, seleccione un horario para la cita');
        return;
      }

      // Establecer fecha y hora de la cita
      const appointmentDate = new Date(this.selectedSlot.date);
      const timeParts = this.selectedSlot.time.split(/[\s:]/);
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const isPM = this.selectedSlot.time.includes('PM');
      
      // Convertir a formato 24 horas si es necesario
      let hour24 = hours;
      if (isPM && hours < 12) hour24 += 12;
      if (!isPM && hours === 12) hour24 = 0;
      
      appointmentDate.setHours(hour24, minutes, 0, 0);
      console.log('Fecha y hora de la cita:', appointmentDate);

      // Verificar que estamos en staff/agenda o tenemos rol staff/doctor
      if (isStaffPage || this.role === 'staff' || this.role === 'doctor' || this.role === 'admin') {
        // Verificar si hay paciente seleccionado
        if (!this.appointment.patient) {
          console.error('No se ha seleccionado un paciente');
          alert('Por favor, seleccione un paciente');
          return;
        }
        console.log('Paciente seleccionado:', this.appointment.patient);
        
        // Validación adicional para asegurar que el ID del paciente es válido
        if (this.appointment.patient === 'undefined' || this.appointment.patient === 'null' || this.appointment.patient === '') {
          // Intentar asignar el primer paciente si hay alguno disponible
          if (this.patients && this.patients.length > 0) {
            this.appointment.patient = this.patients[0]._id;
            console.log('ID de paciente asignado automáticamente:', this.appointment.patient);
          } else {
            console.error('No hay pacientes disponibles para asignar');
            alert('Error: No hay pacientes disponibles para asignar la cita. Por favor, registre pacientes antes de continuar.');
            return;
          }
        }
      } else {
        // Para pacientes normales, usar su propio ID
        this.appointment.patient = this.userService.getUser()?._id || '';
        console.log('ID del paciente (auto-asignado):', this.appointment.patient);
      }

      // Verificar que tengamos un ID de paciente válido
      if (!this.appointment.patient || this.appointment.patient === 'undefined' || this.appointment.patient === 'null' || this.appointment.patient === '') {
        console.error('No hay un ID de paciente válido');
        alert('Error: No se ha podido determinar el paciente para la cita');
        return;
      }

      // Verificar selección de doctor
      if (!this.appointment.doctor) {
        console.error('No se ha seleccionado un doctor');
        alert('Por favor, seleccione un doctor');
        return;
      }

      // Verificar motivo de consulta
      if (!this.appointment.reason || this.appointment.reason.trim() === '') {
        console.error('No se ha especificado el motivo de la consulta');
        alert('Por favor, indique el motivo de la consulta');
        return;
      }

      // Preparar datos para enviar
      const appointmentData = {
        doctor: this.appointment.doctor,
        patient: this.appointment.patient,
        start: appointmentDate.toISOString(),
        reason: this.appointment.reason,
        // Si el usuario es staff o admin, incluir el ID del creador
        creator_id: (isStaffPage || this.role === 'staff' || this.role === 'admin') ? 
                    (this.currentUserId || 'staff_user') : undefined
      };

      console.log('Datos de la cita a enviar:', appointmentData);

      try {
        // Enviar solicitud para crear la cita
        const backUrl = await back_url();
        const response = await firstValueFrom(
          this.http.post(`${backUrl}/api/appointments/create/`, appointmentData)
        );

        console.log('Respuesta al crear cita:', response);

        // Actualizar la lista de citas después de crear la nueva
        await this.loadAppointments();
        this.resetForm();

        // Mostrar mensaje de éxito
        alert('Cita programada correctamente. Se ha enviado un correo de confirmación al paciente.');
      } catch (error: any) {
        console.error('Error al crear la cita:', error);
        
        // Intentar obtener un mensaje de error más específico
        let errorMsg = 'Error al programar la cita';
        if (error.error && error.error.error) {
          errorMsg += ': ' + error.error.error;
        } else if (error.message) {
          errorMsg += ': ' + error.message;
        }
        
        alert(errorMsg + '. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error inesperado al procesar el formulario:', error);
      alert('Ha ocurrido un error inesperado. Por favor, intente nuevamente.');
    }
  }

  resetForm(): void {
    const currentPatient = this.appointment?.patient || '';
    
    // Guardar el slot actual si existe
    const currentSlot = this.selectedSlot;
    
    this.selectedSlot = currentSlot;
    this.appointment = { 
      doctor: '', 
      date: '', 
      time: '', 
      reason: '',
      patient: currentPatient // Mantener el paciente seleccionado
    };
    
    console.log('Formulario reseteado, manteniendo paciente:', this.appointment.patient);
  }

  // Agregar método para cargar pacientes
  async loadPatients(): Promise<void> {
    console.log('Iniciando carga de pacientes reales del hospital...');
    
    try {
      // Verificar si estamos en la página de staff agenda o somos staff/doctor/admin
      const isStaffPage = window.location.href.includes('/staff/agenda') || 
                          window.location.href.includes('staff%2Fagenda');
      
      if (isStaffPage && this.role !== 'staff') {
        console.log('Forzando rol staff para carga de pacientes');
        this.role = 'staff';
      }
      
      console.log('Cargando lista de pacientes para rol:', this.role);
      
      const apiUrl = await back_url();
      
      // Usar la misma URL que utiliza el componente de recetas
      this.http.get<any>(`${apiUrl}/users`).subscribe({
        next: (response) => {
          console.log('Respuesta de API para pacientes:', response);
          
          if (response && response.appointments && Array.isArray(response.appointments)) {
            // Filtrar solo usuarios con rol de paciente, igual que en recipes-page
            this.patients = response.appointments.filter(
              (user: User) => user.rol === 'paciente'
            );
            
            // Asegurarse de que los pacientes tienen los campos necesarios
            this.patients = this.patients.map(patient => {
              // Si no tiene username e identificación, usar otros campos disponibles
              if (!patient.username) {
                patient.username = patient.name || patient.email || 'Paciente sin nombre';
              }
              
              // Identificación para mostrar
              if (!patient.identification) {
                patient.identification = patient.email || patient._id || 'Sin ID';
              }
              
              return patient;
            });
            
            console.log('Pacientes filtrados y procesados:', this.patients);
            
            // Inicializar el valor del paciente en el modelo appointment si es necesario
            if (this.role === 'staff' || this.role === 'doctor' || this.role === 'admin') {
              // Si hay pacientes disponibles, inicializar con el primero
              if (this.patients && this.patients.length > 0) {
                console.log('Inicializando appointment.patient con el primer paciente de la lista');
                this.appointment.patient = this.patients[0]._id;
              } else {
                console.log('No hay pacientes disponibles para inicializar');
                this.appointment.patient = '';
              }
            } else {
              // Para pacientes normales, usar su propio ID
              this.appointment.patient = this.userService.getUser()?._id || '';
              console.log('ID del paciente (auto-asignado):', this.appointment.patient);
            }
          } else {
            console.error('Formato de respuesta inesperado:', response);
            this.patients = [];
            alert('Error: Formato de respuesta inesperado al cargar pacientes.');
          }
          
          // Informar si no hay pacientes
          if (!this.patients || this.patients.length === 0) {
            console.warn('No se encontraron pacientes en el sistema');
            alert('No hay pacientes registrados en el sistema. Por favor, registre pacientes antes de asignar citas.');
          }
          
          console.log(`Total de ${this.patients.length} pacientes reales cargados del hospital`);
        },
        error: (error) => {
          console.error('Error al cargar pacientes:', error);
          this.patients = [];
          alert('Error al cargar la lista de pacientes. Por favor, intente nuevamente o contacte a soporte técnico.');
        }
      });
    } catch (error) {
      console.error('Error inesperado al cargar pacientes:', error);
      this.patients = [];
      alert('Error al cargar la lista de pacientes. Por favor, intente nuevamente.');
    }
  }

  async getDoctorsAvailableForSlot(day: Date, time: string): Promise<any[]> {
    console.log('Obteniendo doctores disponibles para slot:', day, time);
    
    const url = await back_url();
    try {
      // Usar el mismo endpoint que utiliza el componente de recetas para obtener doctores
      return new Promise((resolve) => {
        this.http.get<any>(`${url}/users`).subscribe({
          next: (response) => {
            console.log('Doctores disponibles (respuesta API):', response);
            
            if (response && response.appointments && Array.isArray(response.appointments)) {
              // Filtrar solo usuarios con rol doctor
              const allDoctors = response.appointments.filter(
                (user: any) => user.rol === 'doctor'
              );
              
              console.log('Todos los doctores filtrados:', allDoctors);
              
              // Si el usuario es un doctor o staff, podemos gestionar citas para cualquier doctor
              if (this.role === 'doctor' || this.role === 'staff' || this.role === 'admin' || 
                  window.location.href.includes('/staff/agenda') || 
                  window.location.href.includes('staff%2Fagenda')) {
                resolve(allDoctors);
              } else {
                // Filtrar doctores que ya tienen cita en ese horario
                const doctorsWithAppointments = this.appointments
                  .filter(
                    (a) =>
                      new Date(a.start).toDateString() === day.toDateString() &&
                      a.time === time
                  )
                  .map((a) => a.doctor);

                const availableDoctors = allDoctors.filter(
                  (d: any) => !doctorsWithAppointments.includes(d._id)
                );
                
                console.log('Doctores disponibles para este horario:', availableDoctors);
                resolve(availableDoctors);
              }
            } else {
              console.error('Formato de respuesta inesperado para doctores:', response);
              resolve([]);
            }
          },
          error: (error) => {
            console.error('Error al cargar doctores disponibles:', error);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error inesperado al cargar doctores disponibles:', error);
      return [];
    }
  }
}
