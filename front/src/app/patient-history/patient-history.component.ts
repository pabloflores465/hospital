import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { MedicalRecordService } from '../services/medical-record.service';
import { DoctorService, Recipe as BaseRecipe, Medicine } from '../services/doctor.service';
import { back_url } from '../../environments/back_url';
import { firstValueFrom } from 'rxjs';

interface PatientHistory {
  id: number;
  name: string;
  diagnoses: string[];
  procedures: string[];
  examResults: string;
}

interface Patient {
  _id: string;
  name: string;
  username?: string;
  email: string;
  rol: string;
  identification?: string;
}

// Extender la interfaz Recipe para incluir propiedades adicionales que llegan del backend
interface Recipe extends BaseRecipe {
  formatted_code?: string;
  created_at?: Date;
  doctor_details?: {
    _id: string;
    name: string;
    username: string;
    email: string;
  };
  doctor?: string;
}

interface Consultation {
  _id: string;
  patient_id: string;
  type: string;
  diagnosis: string;
  procedures: string[];
  service_id: string;
  date: Date;
  staff: {
    doctor?: {
      id: string;
      name: string;
    }
  };
  comments?: Array<{
    _id: string;
    user_id: string;
    content: string;
    created_at: Date;
    user_role?: string;
  }>;
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.css']
})
export class PatientHistoryComponent implements OnInit {
  histories: PatientHistory[] = [];
  searchTerm: string = '';
  filteredHistories: PatientHistory[] = [];
  
  // Nuevas propiedades para la funcionalidad solicitada
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  patientConsultations: Consultation[] = [];
  patientRecipes: Recipe[] = [];
  loading = false;
  errorMessage = '';
  
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private medicalRecordService: MedicalRecordService,
    private doctorService: DoctorService
  ) {}
  
  async ngOnInit(): Promise<void> {
    this.loadMockHistories(); // Mantener temporalmente mientras se implementa la funcionalidad real
    this.filteredHistories = this.histories;
    
    try {
      // Cargar la lista de pacientes
      await this.loadPatients();
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      this.errorMessage = 'No se pudieron cargar los pacientes. Por favor, intente nuevamente.';
    }
  }
  
  // Mantener la carga de historias mock temporalmente
  loadMockHistories(): void {
    this.histories = [
      {
        id: 1,
        name: 'Paciente 1',
        diagnoses: ['Hipertensión', 'Diabetes'],
        procedures: ['ECG', 'Examen de sangre'],
        examResults: 'Resultados normales'
      },
      {
        id: 2,
        name: 'Paciente 2',
        diagnoses: ['Asma'],
        procedures: ['Espirometría'],
        examResults: 'Leve deterioro pulmonar'
      }
    ];
  }
  
  // Filtrar historias por nombre (para la búsqueda actual)
  searchHistories(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredHistories = this.histories.filter(history =>
      history.name.toLowerCase().includes(term)
    );
    
    // Aplicar filtro también a la lista de pacientes
    if (this.patients.length > 0) {
      this.patients = this.patients.filter(patient => 
        patient.name.toLowerCase().includes(term) || 
        (patient.username && patient.username.toLowerCase().includes(term)) ||
        (patient.email && patient.email.toLowerCase().includes(term))
      );
    }
  }
  
  // Cargar la lista de pacientes desde el servidor
  async loadPatients(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      // Usar el método específico para selección de pacientes
      this.patients = await this.userService.getPatientsForSelection();
      
      if (this.patients.length === 0) {
        // No se encontraron pacientes, usando datos de respaldo
        console.warn('No se encontraron pacientes, usando datos de respaldo');
        this.patients = [
          {
            _id: '67dd0af00d9fcd8d2fc7a1fb',
            username: 'paciente1',
            name: 'Paciente Uno',
            email: 'paciente1@example.com',
            rol: 'paciente',
            identification: '123456789',
          },
          {
            _id: '67dd0c21ca818ed8dbd96c29',
            username: 'paciente2',
            name: 'Paciente Dos',
            email: 'paciente2@example.com',
            rol: 'paciente',
            identification: '987654321',
          }
        ];
        
        console.log('Pacientes de respaldo cargados:', this.patients.length);
      } else {
        console.log('Pacientes cargados correctamente:', this.patients.length);
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      
      // Usar datos de respaldo en caso de error
      this.patients = [
        {
          _id: '67dd0af00d9fcd8d2fc7a1fb',
          username: 'paciente1',
          name: 'Paciente Uno',
          email: 'paciente1@example.com',
          rol: 'paciente',
          identification: '123456789',
        },
        {
          _id: '67dd0c21ca818ed8dbd96c29',
          username: 'paciente2',
          name: 'Paciente Dos',
          email: 'paciente2@example.com',
          rol: 'paciente',
          identification: '987654321',
        }
      ];
      
      console.log('Pacientes de respaldo cargados por error:', this.patients.length);
    } finally {
      this.loading = false;
    }
  }
  
  // Seleccionar un paciente y cargar sus datos
  async selectPatient(patient: Patient): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.selectedPatient = patient;
    
    try {
      // Cargar el historial médico del paciente
      await this.loadPatientConsultations(patient._id);
      
      // Cargar las recetas del paciente
      await this.loadPatientRecipes(patient._id);
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
      this.errorMessage = 'No se pudieron cargar los datos del paciente. Por favor, intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }
  
  // Cargar consultas médicas del paciente
  async loadPatientConsultations(patientId: string): Promise<void> {
    try {
      // Obtener el observable de patientRecord
      const recordObservable = await this.medicalRecordService.getPatientRecord(patientId);
      // Convertir el observable a promesa
      const response = await firstValueFrom(recordObservable);
      
      if (response && response.record && response.record.procedures) {
        this.patientConsultations = response.record.procedures;
      } else {
        this.patientConsultations = [];
      }
    } catch (error) {
      console.error('Error al cargar consultas del paciente:', error);
      this.patientConsultations = [];
      throw error;
    }
  }
  
  // Cargar recetas del paciente
  async loadPatientRecipes(patientId: string): Promise<void> {
    try {
      const apiUrl = await back_url();
      // Usar el servicio de doctor para obtener las recetas del paciente
      const response = await firstValueFrom(this.http.get<{patient: Patient, recipes: Recipe[]}>(`${apiUrl}/recipes/patient/${patientId}`));
      
      if (response && response.recipes) {
        this.patientRecipes = response.recipes;
      } else {
        this.patientRecipes = [];
      }
    } catch (error) {
      console.error('Error al cargar recetas del paciente:', error);
      this.patientRecipes = [];
      throw error;
    }
  }
  
  // Formatear fecha para mostrar
  formatDate(date: Date | string): string {
    if (!date) return 'Fecha no disponible';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Verificar si una consulta tiene respuestas
  hasResponses(consultation: Consultation): boolean {
    return !!(consultation.comments && consultation.comments.length > 0);
  }
  
  // Obtener respuestas de doctores para una consulta
  getDoctorResponses(consultation: Consultation): Array<{content: string, date: Date}> {
    if (!consultation.comments) return [];
    
    return consultation.comments
      .filter(comment => comment.user_role === 'doctor')
      .map(comment => ({
        content: comment.content,
        date: comment.created_at
      }));
  }
}
