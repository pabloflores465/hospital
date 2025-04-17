import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';
import { UserService } from '../services/user.service';
import { RouterModule } from '@angular/router';

// Interfaces para el reporte
interface MedicineReportItem {
  rank: number;
  principio_activo: string;
  total_recetas: number;
}

interface PrincipioActivo {
  _id: string;
  name?: string;   // Puede ser name o nombre
  nombre?: string; // Según como venga de la API
}

@Component({
  selector: 'app-medicines-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './medicines-report.component.html',
  styleUrls: ['./medicines-report.component.css']
})
export class MedicinesReportComponent implements OnInit {
  // Parámetros de filtrado
  principioActivo: string = ''; // Valor inicial para "Todos"
  startDate: string = '';
  endDate: string = '';
  limit: number = 10;
  
  // Datos del reporte
  loading: boolean = false;
  error: string | null = null;
  reportData: MedicineReportItem[] = [];
  principiosActivosList: PrincipioActivo[] = []; // Lista para el dropdown
  loadingPrincipios: boolean = false;

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
    this.loadPrincipiosActivos();
    // No generamos el reporte inicial para evitar errores si el dropdown no está listo
    // this.generateReport();
  }

  // Función auxiliar para obtener el nombre correcto del principio activo
  getPrincipioActivoName(principio: PrincipioActivo): string {
    return principio.nombre || principio.name || '';
  }

  async loadPrincipiosActivos(): Promise<void> {
    this.loadingPrincipios = true;
    try {
      const url = await back_url();
      this.http.get<any>(`${url}/medicines/principios-activos`).subscribe({
        next: (response) => {
          this.principiosActivosList = response.principios_activos || [];
          this.loadingPrincipios = false;
          console.log('Principios activos cargados:', this.principiosActivosList);
          
          // Generar el reporte una vez cargados los principios activos
          this.generateReport();
        },
        error: (err) => {
          console.error('Error al cargar principios activos:', err);
          this.error = 'No se pudieron cargar los principios activos para el filtro.';
          this.loadingPrincipios = false;
        }
      });
    } catch (err: any) {
      console.error('Error al cargar principios activos:', err);
      this.error = 'Error al obtener la URL del backend.';
      this.loadingPrincipios = false;
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

    try {
      const url = await back_url();
      let params: any = {
        start_date: this.startDate,
        end_date: this.endDate,
        limit: this.limit
      };
      
      // Solo añadir principio_activo si está definido y no es la opción "Todos"
      if (this.principioActivo && this.principioActivo !== '') {
        params.principio_activo = this.principioActivo;
      }
      
      console.log('Generando reporte con parámetros:', params);

      this.http.get(`${url}/api/reports/medicines`, { params }).subscribe({
        next: (response: any) => {
          this.reportData = response.data || [];
          this.loading = false;
          console.log('Datos del reporte recibidos:', this.reportData);
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