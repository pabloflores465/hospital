import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { back_url } from '../../environments/back_url';

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

@Component({
  selector: 'app-doctor-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
    // Cargar los datos iniciales
    this.generateReport();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    return !!this.startDate && !!this.endDate;
  }

  async generateReport(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = 'Por favor complete todos los campos.';
      return;
    }

    const currentUser = this.userService.getUser();
    if (!currentUser || currentUser.rol !== 'doctor') {
      this.error = 'Solo los doctores pueden ver este reporte.';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const url = await back_url();
      this.http.get(`${url}/api/reports/doctor-appointments`, {
        params: {
          doctor_id: currentUser._id,
          start_date: this.startDate,
          end_date: this.endDate,
          report_type: this.reportType
        }
      }).subscribe({
        next: (response: any) => {
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
          this.error = 'Error al cargar el reporte: ' + (err.error?.error || err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    } catch (err: any) {
      this.error = 'Error al generar el reporte: ' + err.message;
      this.loading = false;
    }
  }

  // Formatear valor como moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ' 
    }).format(value);
  }

  // Formatear fecha para mostrar
  formatDateDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
