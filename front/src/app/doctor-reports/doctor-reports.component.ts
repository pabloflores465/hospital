import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';
import { UserService } from '../services/user.service';
import { RouterModule } from '@angular/router';

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
}

interface PatientInfo {
  id: string;
  name: string;
}

interface AppointmentSummary {
  total_appointments: number;
  total_insurance_payment: number;
  total_direct_payment: number;
}

interface GroupedAppointment {
  date: string;
  total_appointments: number;
  insurance_payment_total: number;
  direct_payment_total: number;
}

interface IndividualAppointment {
  date: string;
  time: string;
  patient: PatientInfo;
  payment_type: string;
  amount: number;
}

interface Doctor {
  _id: string;
  username: string;
  email: string;
  rol: string;
  especialidad?: string;
}

@Component({
  selector: 'app-doctor-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './doctor-reports.component.html',
  styleUrls: ['./doctor-reports.component.css']
})
export class DoctorReportsComponent implements OnInit {
  // Parámetros de filtrado
  startDate: string = '';
  endDate: string = '';
  reportType: 'grouped' | 'individual' = 'grouped';
  
  // Datos del reporte
  loading: boolean = false;
  error: string | null = null;
  doctorInfo: DoctorInfo | null = null;
  groupedData: GroupedAppointment[] = [];
  individualData: IndividualAppointment[] = [];
  summary: AppointmentSummary | null = null;
  
  // Control de fecha máxima (hoy)
  maxDate: string = '';

  // Datos para administradores
  isAdmin: boolean = false;
  selectedDoctorId: string = '';
  doctors: Doctor[] = [];
  loadingDoctors: boolean = false;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {
    // Establecer la fecha máxima como hoy
    const today = new Date();
    this.maxDate = this.formatDate(today);
    
    // Por defecto, mostrar el mes actual
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.maxDate;
  }

  ngOnInit(): void {
    const currentUser = this.userService.getUser();
    console.log('Usuario actual:', currentUser);
    
    // Verificar si el usuario es administrador
    this.isAdmin = currentUser && currentUser.rol === 'admin' ? true : false;
    console.log('Es administrador:', this.isAdmin);
    
    // Si es doctor, establecer su ID como seleccionado
    if (currentUser && currentUser.rol === 'doctor') {
      this.selectedDoctorId = currentUser._id;
      console.log('ID de doctor seleccionado:', this.selectedDoctorId);
    }
    
    // Si es administrador, cargar la lista de doctores
    if (this.isAdmin) {
      console.log('Cargando doctores para administrador...');
      this.loadDoctors();
    } else {
      // Cargar los datos iniciales para doctores
      console.log('Generando reporte para doctor...');
      this.generateReport();
    }
  }

  async loadDoctors(): Promise<void> {
    this.loadingDoctors = true;
    this.error = null;
    
    try {
      const url = await back_url();
      // Usar la API de usuarios existente en lugar de /api/doctors/list
      this.http.get<any>(`${url}/users`).subscribe({
        next: (res) => {
          // Filtrar usuarios con rol "doctor" del resultado
          this.doctors = res.users.filter((user: any) => user.rol === 'doctor');
          
          // Si hay doctores, seleccionar el primero por defecto
          if (this.doctors && this.doctors.length > 0) {
            this.selectedDoctorId = this.doctors[0]._id;
            this.generateReport();
          } else {
            this.error = 'No se encontraron doctores en el sistema.';
          }
          
          this.loadingDoctors = false;
        },
        error: (err) => {
          console.error('Error al cargar doctores:', err);
          this.error = 'Error al cargar la lista de doctores: ' + 
                      (err.error?.error || err.message || 'Error desconocido');
          this.loadingDoctors = false;
        }
      });
    } catch (err: any) {
      console.error('Error en loadDoctors:', err);
      this.error = 'Error al cargar doctores: ' + err.message;
      this.loadingDoctors = false;
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  isFormValid(): boolean {
    // Para administradores, verificar que haya seleccionado un doctor
    if (this.isAdmin && !this.selectedDoctorId) {
      return false;
    }
    
    return !!this.startDate && !!this.endDate && this.startDate <= this.endDate;
  }

  async generateReport(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = this.isAdmin && !this.selectedDoctorId 
                ? 'Por favor seleccione un doctor.'
                : 'Por favor complete todos los campos.';
      return;
    }

    const currentUser = this.userService.getUser();
    if (!currentUser || (currentUser.rol !== 'doctor' && currentUser.rol !== 'admin')) {
      this.error = 'Solo los doctores y administradores pueden ver este reporte.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.groupedData = [];
    this.individualData = [];
    this.summary = null;

    try {
      const url = await back_url();
      console.log('URL base:', url);
      
      // Determinar qué ID de doctor usar
      const doctorIdToUse = this.isAdmin ? this.selectedDoctorId : currentUser._id;
      console.log('Generando reporte para doctor ID:', doctorIdToUse);
      
      // Asegurar que tengamos un ID de doctor válido
      if (!doctorIdToUse) {
        this.error = 'Error: No se pudo determinar el ID del doctor para el reporte.';
        this.loading = false;
        return;
      }
      
      this.http.get(`${url}/api/reports/doctor-appointments`, {
        params: {
          doctor_id: doctorIdToUse,
          start_date: this.startDate,
          end_date: this.endDate,
          report_type: this.reportType
        }
      }).subscribe({
        next: (response: any) => {
          console.log('Respuesta del reporte:', response);
          this.doctorInfo = response.doctor;
          this.summary = response.summary;
          
          if (this.reportType === 'grouped') {
            this.groupedData = response.data;
            this.individualData = [];
          } else {
            this.individualData = response.data;
            this.groupedData = [];
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error obteniendo el reporte:', err);
          this.error = 'Error al cargar el reporte: ' + (err.error?.error || err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    } catch (err: any) {
      console.error('Error general:', err);
      this.error = 'Error al generar el reporte: ' + err.message;
      this.loading = false;
    }
  }

  onDoctorChange(): void {
    // Limpiar datos actuales y generar nuevo reporte
    this.groupedData = [];
    this.individualData = [];
    this.summary = null;
    this.error = null;
    
    if (this.selectedDoctorId) {
      this.generateReport();
    }
  }
}
