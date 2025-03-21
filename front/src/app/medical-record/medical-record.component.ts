import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicalRecordService } from '../services/medical-record.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';

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
}

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medical-record.component.html'
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
    private router: Router
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
    
    // Obtener patientId de la URL si existe
    this.route.paramMap.subscribe(params => {
      const urlPatientId = params.get('patientId');
      
      // Si hay un ID en la URL y el usuario es médico, usar ese ID
      if (urlPatientId && this.isDoctor) {
        this.patientId = urlPatientId;
        this.loadPatientRecord();
      } 
      // Si es paciente, usar su propio ID
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

  loadPatientRecord() {
    if (!this.patientId) {
      this.errorMessage = 'ID de paciente no válido';
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    
    // Cargar datos reales desde la API en lugar de datos de prueba
    this.medicalRecordService.getPatientRecord(this.patientId)
      .subscribe({
        next: (response) => {
          console.log('Datos recibidos de la API:', response);
          this.record = response.record;
          
          if (this.record?.procedures) {
            // Ordenar procedimientos por fecha (más reciente primero)
            this.record.procedures.sort((a, b) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            // Procesar cada procedimiento para formatear fechas y datos
            this.record.procedures.forEach(procedure => {
              // Manejar el formato de fecha o cualquier otro procesamiento necesario
              if (procedure.service_id) {
                // Podríamos cargar información adicional del servicio si es necesario
                console.log('Procedimiento asociado al servicio:', procedure.service_id);
              }
            });
          }
          
          this.isLoading = false;
          this.inDevelopment = false; // Ya no estamos en modo desarrollo porque usamos datos reales
        },
        error: (error) => {
          console.error('Error al cargar la ficha médica:', error);
          this.errorMessage = 'Error al cargar la ficha médica. Intente nuevamente más tarde.';
          this.isLoading = false;
          
          // Si hay un error, cargar datos de prueba en modo desarrollo
          if (this.inDevelopment) {
            setTimeout(() => {
              this.loadMockData();
              this.isLoading = false;
            }, 1000);
          }
        }
      });
  }

  loadMockData() {
    this.record = {
      personal_info: {
        full_name: 'Carlos Ramírez Sánchez',
        birth_date: '1985-06-12',
        identification: 'DPI-12345678',
        insurance_number: 'SEG-987654321',
        address: 'Calle Principal 123, Ciudad',
        contact_info: 'carlos.ramirez@email.com / +1 234 567 8901'
      },
      procedures: [
        {
          _id: 'proc1',
          type: 'Consulta Cardiológica',
          date: '2023-10-15T09:30:00Z',
          diagnosis: 'Hipertensión arterial leve',
          observations: 'Se recomienda dieta baja en sodio y ejercicio moderado',
          staff: {
            doctor: {
              name: 'Dra. María López',
              license: '12345',
              specialty: 'Cardiología'
            }
          },
          financial_info: {
            cost: 150,
            payment_method: 'Seguro médico',
            insurance_details: {
              coverage: '80%',
              policy_number: 'POL-123456'
            }
          },
          comments: [
            {
              user_role: 'doctor',
              created_at: '2023-10-15T10:15:00Z',
              content: 'Paciente presenta buena respuesta al tratamiento inicial'
            }
          ],
          attachments: [
            {
              file_name: 'electrocardiograma.pdf',
              file_url: '#'
            }
          ]
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
              specialty: 'Medicina interna'
            }
          },
          financial_info: {
            cost: 75,
            payment_method: 'Efectivo'
          },
          comments: [],
          attachments: [
            {
              file_name: 'resultados_laboratorio.pdf',
              file_url: '#'
            }
          ]
        }
      ]
    };
    
    // Si estamos viendo un paciente específico, personalizar los datos
    if (this.patientId === '67d985d0ba17ad09ee384993') {
      this.record.personal_info.full_name = 'Usuario';
      this.record.personal_info.identification = 'DPI-12345678';
      this.record.personal_info.contact_info = 'rrrivera@unis.edu.gt / +502 5555-1234';
    } else if (this.patientId === '67db1d99b66c7ee01db87fff') {
      this.record.personal_info.full_name = 'Olakeace';
      this.record.personal_info.identification = 'DPI-87654321';
      this.record.personal_info.contact_info = 'pablopolis2016@gmail.com / +502 5555-5678';
    }
  }

  addComment(procedureId: string) {
    if (!this.newComment[procedureId]?.trim() || !this.currentUser) return;

    if (this.inDevelopment) {
      // Simulación en modo desarrollo
      const now = new Date();
      const procedure = this.record?.procedures.find(p => p._id === procedureId);
      if (procedure) {
        procedure.comments.push({
          user_role: this.currentUser.rol,
          created_at: now.toISOString(),
          content: this.newComment[procedureId]
        });
        this.newComment[procedureId] = '';
      }
      return;
    }

    const commentData = {
      procedure_id: procedureId,
      user_id: this.currentUser._id,
      user_role: this.currentUser.rol,
      content: this.newComment[procedureId]
    };

    this.medicalRecordService.addComment(commentData)
      .subscribe({
        next: () => {
          this.loadPatientRecord();
          this.newComment[procedureId] = '';
        },
        error: (error) => {
          console.error('Error al agregar comentario:', error);
          this.errorMessage = 'Error al agregar el comentario. Intente nuevamente.';
        }
      });
  }

  onFileSelected(event: any, procedureId: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile[procedureId] = file;
    }
  }

  uploadFile(procedureId: string) {
    if (!this.selectedFile[procedureId] || !this.currentUser) return;

    if (this.inDevelopment) {
      // Simulación en modo desarrollo
      const procedure = this.record?.procedures.find(p => p._id === procedureId);
      if (procedure) {
        procedure.attachments.push({
          file_name: this.selectedFile[procedureId].name,
          file_url: '#'
        });
        delete this.selectedFile[procedureId];
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile[procedureId]);
    formData.append('procedure_id', procedureId);
    formData.append('user_id', this.currentUser._id);

    this.medicalRecordService.uploadAttachment(formData)
      .subscribe({
        next: () => {
          this.loadPatientRecord();
          delete this.selectedFile[procedureId];
        },
        error: (error) => {
          console.error('Error al subir archivo:', error);
          this.errorMessage = 'Error al subir el archivo. Intente nuevamente.';
        }
      });
  }

  // Método para obtener el nombre amigable del servicio
  getServiceName(serviceId: string): string {
    return this.medicalRecordService.getServiceNameById(serviceId);
  }

  // Método para navegar a la lista de pacientes
  goToPatientList(): void {
    this.router.navigate(['/medical-record/patients']);
  }
} 