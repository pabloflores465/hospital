import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';
import { UserService } from '../services/user.service';
import { RouterModule } from '@angular/router';

// Interfaces para el reporte
interface RejectedUserItem {
  rank: number;
  user_id: string;
  username: string;
  total_rejections: number;
}

@Component({
  selector: 'app-rejected-users-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './rejected-users-report.component.html',
  styleUrls: ['./rejected-users-report.component.css']
})
export class RejectedUsersReportComponent implements OnInit {
  // Parámetros de filtrado
  startDate: string = '';
  endDate: string = '';
  limit: number = 10;
  
  // Datos del reporte
  loading: boolean = false;
  error: string | null = null;
  reportData: RejectedUserItem[] = [];
  isExampleData: boolean = false; // Para indicar si son datos de ejemplo
  
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
    // Generar el reporte inicial
    this.generateReport();
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

  isFormValid(): boolean {
    return !!this.startDate && !!this.endDate && this.startDate <= this.endDate;
  }

  async generateReport(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = 'Por favor complete correctamente las fechas.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.isExampleData = false;

    try {
      const url = await back_url();
      let params: any = {
        start_date: this.startDate,
        end_date: this.endDate,
        limit: this.limit
      };
      
      console.log('Generando reporte de usuarios rechazados con parámetros:', params);

      this.http.get(`${url}/api/reports/rejected-users`, { params }).subscribe({
        next: (response: any) => {
          this.reportData = response.data || [];
          this.isExampleData = response.is_example_data || false;
          this.loading = false;
          console.log('Datos del reporte recibidos:', this.reportData, 'Son datos de ejemplo:', this.isExampleData);
        },
        error: (err) => {
          console.error('Error al generar reporte:', err);
          this.error = 'Error al cargar el reporte: ' + (err.error?.error || err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    } catch (err: any) {
      console.error('Error al generar reporte (catch):', err);
      this.error = 'Error al generar el reporte: ' + err.message;
      this.loading = false;
    }
  }
} 