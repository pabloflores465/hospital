import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicalRecordService } from '../services/medical-record.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';

interface MedicalRecord {
  personal_info: {
    full_name: string;
    birth_date: string;
    identification: string;
    insurance_number: string;
    address: string;
    contact_info: string;
  };
  procedures: Array<{
    _id: string;
    type: string;
    service_id?: string;
    date: string;
    diagnosis: string;
    observations: string;
    staff: {
      doctor: {
        name: string;
        license: string;
        specialty: string;
      };
    };
    financial_info: {
      cost: number;
      payment_method: string;
      copay?: number;
      total?: number;
      insurance_details?: any;
    };
    comments: Array<{
      user_role: string;
      created_at: string;
      content: string;
    }>;
    attachments: Array<{
      file_name: string;
      file_url: string;
    }>;
  }>;
  appointments?: Array<{
    _id: string;
    start: string;
    end?: string;
    details: string;
    reason: string;
    doctor: any;
    completed: boolean;
    diagnosis?: string;
    exams?: string;
    next_steps?: string;
  }>;
  recipes?: Array<{
    _id: string;
    code: string;
    created_at: string;
    formatted_date?: string;
    doctor_details?: any;
    medicines?: Array<any>;
    diagnosis?: string;
    exams?: string;
    next_steps?: string;
    special_notes?: string;
  }>;
}

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medical-record.component.html',
})
export class MedicalRecordComponent implements OnInit {
  record: MedicalRecord | null = null;
  newComment: { [key: string]: string } = {};
  selectedFile: { [key: string]: File } = {};
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  inDevelopment = true;
  patientId: string | null = null;
  isDoctor = false;

  constructor(
    private medicalRecordService: MedicalRecordService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.getUser();

    if (!this.currentUser) {
      this.errorMessage = 'Necesita iniciar sesión para ver la ficha médica';
      this.isLoading = false;
      return;
    }

    // Determinar si el usuario es médico o paciente
    this.isDoctor = this.currentUser.rol.toLowerCase() === 'doctor';

    // Comprobar si estamos en la ruta del dashboard del paciente
    const isInPatientDashboard = this.router.url.includes('/patient/dashboard');

    // Obtener patientId de la URL si existe
    this.route.paramMap.subscribe((params) => {
      const urlPatientId = params.get('patientId');

      // Si hay un ID en la URL y el usuario es médico, usar ese ID
      if (urlPatientId && this.isDoctor) {
        this.patientId = urlPatientId;
        this.loadPatientRecord();
      }
      // Si es paciente, usar su propio ID (tanto en la ruta directa como en el dashboard)
      else if (!this.isDoctor && this.currentUser) {
        this.patientId = this.currentUser._id;
        this.loadPatientRecord();
      }
      // Si es médico y no hay ID en la URL, redirigir a la selección de pacientes
      else if (this.isDoctor && !urlPatientId) {
        this.router.navigate(['/medical-record/patients']);
        return;
      }
    });
  }

  async loadPatientRecord() {
    if (!this.patientId) {
      this.errorMessage = 'No se ha especificado un paciente';
      this.isLoading = false;
      return;
    }

    try {
      // En un entorno real, se cargaría desde el backend
      if (this.inDevelopment) {
        // Usar datos de ejemplo para desarrollo
        this.loadMockData();
        // Cargar citas y recetas adicionales
        await this.loadAppointments();
        await this.loadRecipes();
        this.isLoading = false;
        return;
      }

      // En un entorno real, se obtendría de una API
      const recordObservable = await this.medicalRecordService.getPatientRecord(
        this.patientId
      );

      recordObservable.subscribe({
        next: (data) => {
          this.record = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar el registro médico:', error);
          this.errorMessage =
            'Error al cargar el registro médico. ' + error.message;
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Error en loadPatientRecord:', error);
      this.errorMessage = 'Error al cargar los datos del paciente';
      this.isLoading = false;
    }
  }

  getServiceName(serviceId: string): string {
    // Aquí se podría obtener el nombre del servicio desde una API
    // Por ahora, devolvemos valores codificados
    const services: { [key: string]: string } = {
      serv1: 'Cardiología',
      serv2: 'Laboratorio',
      serv3: 'Radiología',
    };
    return services[serviceId] || 'Servicio general';
  }

  addComment(procedureId: string) {
    if (!this.newComment[procedureId]?.trim()) {
      return;
    }

    // En un entorno real, se enviaría a una API
    if (this.inDevelopment) {
      // Solo para desarrollo, añadir localmente
      if (this.record) {
        const procedure = this.record.procedures.find(
          (p) => p._id === procedureId
        );
        if (procedure) {
          procedure.comments.push({
            user_role: this.isDoctor ? 'doctor' : 'patient',
            created_at: new Date().toISOString(),
            content: this.newComment[procedureId],
          });
          this.newComment[procedureId] = '';
        }
      }
      return;
    }

    // En un entorno real, se enviaría a la API
  }

  onFileSelected(event: any, procedureId: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile[procedureId] = file;
    }
  }

  uploadFile(procedureId: string) {
    if (!this.selectedFile[procedureId]) {
      return;
    }

    // En un entorno real, se enviaría a una API
    if (this.inDevelopment) {
      // Solo para desarrollo, simular subida
      if (this.record) {
        const procedure = this.record.procedures.find(
          (p) => p._id === procedureId
        );
        if (procedure) {
          procedure.attachments.push({
            file_name: this.selectedFile[procedureId].name,
            file_url: '#',
          });
          delete this.selectedFile[procedureId];
        }
      }
      return;
    }

    // En un entorno real, se enviaría a la API
  }

  goToPatientList() {
    this.router.navigate(['/medical-record/patients']);
  }

  async loadAppointments() {
    if (!this.patientId || !this.record) return;

    try {
      const url = await back_url();
      // Asegurar que las solicitudes funcionen tanto en localhost como en IP específica
      const apiUrl = url.replace('localhost', '192.168.0.21');
      
      this.http.get<any>(`${apiUrl}/api/appointments/patient/${this.patientId}`).subscribe({
        next: (data) => {
          if (data && data.appointments) {
            // Asegurarse de que existe la propiedad appointments en el record
            if (!this.record!.appointments) {
              this.record!.appointments = [];
            }
            
            // Agregar las citas al registro médico
            this.record!.appointments = data.appointments.map((appt: any) => {
              return {
                _id: appt._id,
                start: appt.start,
                end: appt.end || '',
                details: appt.details || '',
                reason: appt.reason || 'Sin especificar',
                doctor: appt.doctor || {},
                completed: appt.completed || false,
                diagnosis: appt.diagnosis || '',
                exams: appt.exams || '',
                next_steps: appt.next_steps || ''
              };
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar citas médicas:', error);
        }
      });
    } catch (error) {
      console.error('Error al obtener citas médicas:', error);
    }
  }

  async loadRecipes() {
    if (!this.patientId || !this.record) return;

    try {
      const url = await back_url();
      // Asegurar que las solicitudes funcionen tanto en localhost como en IP específica
      const apiUrl = url.replace('localhost', '192.168.0.21');
      
      this.http.get<any>(`${apiUrl}/recipes/patient/${this.patientId}`).subscribe({
        next: (data) => {
          if (data && (data.recipes || Array.isArray(data))) {
            // Asegurarse de que existe la propiedad recipes en el record
            if (!this.record!.recipes) {
              this.record!.recipes = [];
            }
            
            // Determinar si la respuesta es un array directo o está en data.recipes
            const recipesData = Array.isArray(data) ? data : data.recipes;
            
            if (Array.isArray(recipesData)) {
              // Agregar las recetas al registro médico
              this.record!.recipes = recipesData.map((recipe: any) => {
                return {
                  _id: recipe._id,
                  code: recipe.formatted_code || recipe.code || '',
                  created_at: recipe.created_at || new Date().toISOString(),
                  formatted_date: recipe.formatted_date || new Date(recipe.created_at).toLocaleDateString(),
                  doctor_details: recipe.doctor_details || {},
                  medicines: recipe.medicines || [],
                  diagnosis: recipe.diagnosis || '',
                  exams: recipe.exams || '',
                  next_steps: recipe.next_steps || '',
                  special_notes: recipe.special_notes || ''
                };
              });
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar recetas médicas:', error);
        }
      });
    } catch (error) {
      console.error('Error al obtener recetas médicas:', error);
    }
  }

  loadMockData() {
    this.record = {
      personal_info: {
        full_name: 'Carlos Ramírez Sánchez',
        birth_date: '1985-06-12',
        identification: 'DPI-12345678',
        insurance_number: 'SEG-987654321',
        address: 'Calle Principal 123, Ciudad',
        contact_info: 'carlos.ramirez@email.com / +1 234 567 8901',
      },
      procedures: [
        {
          _id: 'proc1',
          type: 'Consulta Cardiológica',
          date: '2023-10-15T09:30:00Z',
          diagnosis: 'Hipertensión arterial leve',
          observations:
            'Se recomienda dieta baja en sodio y ejercicio moderado',
          staff: {
            doctor: {
              name: 'Dra. María López',
              license: '12345',
              specialty: 'Cardiología',
            },
          },
          financial_info: {
            cost: 150,
            payment_method: 'Seguro médico',
            insurance_details: {
              coverage: '80%',
              policy_number: 'POL-123456',
            },
          },
          comments: [
            {
              user_role: 'doctor',
              created_at: '2023-10-15T10:15:00Z',
              content:
                'Paciente presenta buena respuesta al tratamiento inicial',
            },
          ],
          attachments: [
            {
              file_name: 'electrocardiograma.pdf',
              file_url: '#',
            },
          ],
        },
        {
          _id: 'proc2',
          type: 'Análisis de sangre',
          date: '2023-09-28T08:00:00Z',
          diagnosis: 'Niveles normales',
          observations: 'Continuar con revisiones periódicas',
          staff: {
            doctor: {
              name: 'Dr. Juan García',
              license: '67890',
              specialty: 'Medicina interna',
            },
          },
          financial_info: {
            cost: 75,
            payment_method: 'Efectivo',
          },
          comments: [],
          attachments: [
            {
              file_name: 'resultados_laboratorio.pdf',
              file_url: '#',
            },
          ],
        },
      ],
      // Datos de ejemplo para citas médicas
      appointments: [
        {
          _id: 'appt1',
          start: '2023-11-05T10:00:00Z',
          end: '2023-11-05T10:30:00Z',
          details: 'Revisión mensual',
          reason: 'Control de presión arterial',
          doctor: {
            _id: 'doc1',
            username: 'Dra. María López',
            speciality: 'Cardiología'
          },
          completed: true,
          diagnosis: 'Presión arterial controlada',
          exams: 'Electrocardiograma de control',
          next_steps: 'Continuar con medicación actual'
        },
        {
          _id: 'appt2',
          start: '2023-12-10T15:00:00Z',
          end: '2023-12-10T15:30:00Z',
          details: 'Consulta de seguimiento',
          reason: 'Evaluación de tratamiento',
          doctor: {
            _id: 'doc2',
            username: 'Dr. Juan García',
            speciality: 'Medicina interna'
          },
          completed: false
        }
      ],
      // Datos de ejemplo para recetas médicas
      recipes: [
        {
          _id: 'rec1',
          code: '00256-SEG987654321-20231015-4567',
          created_at: '2023-10-15T10:30:00Z',
          formatted_date: '15/10/2023',
          doctor_details: {
            username: 'Dra. María López',
            especialidad: 'Cardiología',
            noLicencia: '12345'
          },
          medicines: [
            {
              principioActivo: 'Enalapril',
              concentracion: '10 mg',
              presentacion: 'Tabletas',
              formaFarmaceutica: 'Oral',
              dosis: '1 tableta',
              frecuencia: 'Cada 12 horas',
              duracion: '30 días',
              diagnostico: 'Hipertensión arterial leve'
            }
          ],
          diagnosis: 'Hipertensión arterial leve',
          special_notes: 'Tomar con comidas. Evitar consumo de alcohol.'
        }
      ]
    };

    // Si estamos viendo un paciente específico, personalizar los datos
    if (this.patientId === '67d985d0ba17ad09ee384993') {
      this.record.personal_info.full_name = 'Usuario';
      this.record.personal_info.identification = 'DPI-12345678';
      this.record.personal_info.contact_info =
        'rrrivera@unis.edu.gt / +502 5555-1234';
    } else if (this.patientId === '67db1d99b66c7ee01db87fff') {
      this.record.personal_info.full_name = 'Olakeace';
      this.record.personal_info.identification = 'DPI-87654321';
      this.record.personal_info.contact_info =
        'pablopolis2016@gmail.com / +502 5555-5678';
    }
  }
}
