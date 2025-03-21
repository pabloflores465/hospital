import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Medicamento {
  principioActivo: string;
  concentracion: string;
  presentacion: string;
  formaFarmaceutica: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  diagnostico: string;
}

interface Receta {
  fecha: Date;
  codigo: string;
  paciente: string;
  nombreMedico: string;
  numeroColegiado: string;
  especialidad: string;
  medicamentos: Medicamento[];
  notasEspeciales: string;
  tieneSeguro: boolean;
}

interface User {
  _id: string;
  username: string;
  email: string;
  rol: string;
  noLicencia?: string;
  especialidad?: string;
  validated: boolean;
}

interface ApiResponse {
  appointments: User[];
}

interface DoctorResponse {
  doctor: User;
}

@Component({
  selector: 'recipes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Generación de Recetas Médicas</h1>

      <div class="bg-white rounded-lg shadow p-6">
        <form [formGroup]="recetaForm" (ngSubmit)="generarReceta()">
          <!-- Datos del médico (automáticos) -->
          <div class="border-b pb-4 mb-4">
            <h2 class="text-xl font-semibold mb-3">Datos del Médico</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nombre del Médico</label
                >
                <input
                  type="text"
                  [value]="doctorActual?.username || 'Cargando...'"
                  class="w-full p-2 border rounded bg-gray-100"
                  readonly
                />
                <!-- Guardamos el ID en un campo oculto -->
                <input type="hidden" formControlName="nombreMedico" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Número de Colegiado</label
                >
                <input
                  type="text"
                  formControlName="numeroColegiado"
                  class="w-full p-2 border rounded bg-gray-100"
                  readonly
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Especialidad</label
                >
                <input
                  type="text"
                  formControlName="especialidad"
                  class="w-full p-2 border rounded bg-gray-100"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Datos de la receta -->
          <div class="border-b pb-4 mb-4">
            <h2 class="text-xl font-semibold mb-3">Datos de la Receta</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  formControlName="fecha"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Paciente</label>
                <select
                  formControlName="paciente"
                  class="w-full p-2 border rounded"
                >
                  <option value="">Seleccione un paciente</option>
                  <option
                    *ngFor="let paciente of pacientes"
                    [value]="paciente._id"
                  >
                    {{ paciente.username }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >¿Paciente con seguro?</label
                >
                <div class="flex items-center mt-2">
                  <input
                    type="checkbox"
                    formControlName="tieneSeguro"
                    id="tieneSeguro"
                    class="mr-2"
                  />
                  <label for="tieneSeguro">Sí, el paciente tiene seguro</label>
                </div>
              </div>
              <div *ngIf="recetaForm.get('tieneSeguro')?.value">
                <label class="block text-sm font-medium mb-1"
                  >Código de Seguro</label
                >
                <input
                  type="text"
                  formControlName="codigoSeguro"
                  class="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          <!-- Datos del medicamento -->
          <div class="border-b pb-4 mb-4" formGroupName="medicamento">
            <h2 class="text-xl font-semibold mb-3">
              Información del Medicamento
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Principio Activo</label
                >
                <select
                  formControlName="principioActivo"
                  class="w-full p-2 border rounded"
                >
                  <option value="">Seleccione un principio activo</option>
                  <option
                    *ngFor="let principio of principiosActivos"
                    [value]="principio.nombre || principio.name"
                  >
                    {{ principio.nombre || principio.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Concentración</label
                >
                <input
                  type="text"
                  formControlName="concentracion"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Presentación</label
                >
                <input
                  type="text"
                  formControlName="presentacion"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Forma Farmacéutica</label
                >
                <input
                  type="text"
                  formControlName="formaFarmaceutica"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Dosis</label>
                <input
                  type="text"
                  formControlName="dosis"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Frecuencia</label>
                <input
                  type="text"
                  formControlName="frecuencia"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Duración</label>
                <input
                  type="text"
                  formControlName="duracion"
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Diagnóstico</label
                >
                <input
                  type="text"
                  formControlName="diagnostico"
                  class="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          <!-- Notas especiales -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1"
              >Notas Especiales</label
            >
            <textarea
              formControlName="notasEspeciales"
              rows="3"
              class="w-full p-2 border rounded"
            ></textarea>
          </div>

          <!-- Botones de acción -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border rounded"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded"
              [disabled]="recetaForm.invalid"
            >
              Generar Receta
            </button>
          </div>
        </form>
      </div>

      <!-- Vista previa de la receta (mostrar después de generarla) -->
      <div *ngIf="recetaGenerada" class="mt-6 bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Vista Previa de Receta</h2>
          <div>
            <button class="px-4 py-2 bg-green-600 text-white rounded mr-2">
              Descargar PDF
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded"
              (click)="enviarPorEmail()"
            >
              Enviar por Email
            </button>
          </div>
        </div>

        <div class="border p-4 rounded">
          <div class="border-b pb-2 mb-2">
            <h3 class="text-lg font-bold">Hospital General</h3>
            <p class="text-sm">Código de Receta: {{ recetaPreview.codigo }}</p>
            <p class="text-sm">
              Fecha: {{ recetaPreview.fecha | date : 'dd/MM/yyyy' }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 border-b pb-2 mb-2">
            <div>
              <p class="font-semibold">Médico:</p>
              <p>{{ recetaPreview.nombreMedico }}</p>
              <p>Colegiado: {{ recetaPreview.numeroColegiado }}</p>
              <p>Especialidad: {{ recetaPreview.especialidad }}</p>
            </div>
            <div>
              <p class="font-semibold">Paciente:</p>
              <p>{{ recetaPreview.paciente }}</p>
            </div>
          </div>

          <div class="border-b pb-2 mb-2">
            <p class="font-semibold">Medicamento:</p>
            <p>
              {{ recetaPreview.medicamento.principioActivo }}
              {{ recetaPreview.medicamento.concentracion }}
            </p>
            <p>
              {{ recetaPreview.medicamento.presentacion }} -
              {{ recetaPreview.medicamento.formaFarmaceutica }}
            </p>
            <p class="mt-2">
              <span class="font-semibold">Dosis:</span>
              {{ recetaPreview.medicamento.dosis }}
            </p>
            <p>
              <span class="font-semibold">Frecuencia:</span>
              {{ recetaPreview.medicamento.frecuencia }}
            </p>
            <p>
              <span class="font-semibold">Duración:</span>
              {{ recetaPreview.medicamento.duracion }}
            </p>
            <p class="mt-2">
              <span class="font-semibold">Diagnóstico:</span>
              {{ recetaPreview.medicamento.diagnostico }}
            </p>
          </div>

          <div *ngIf="recetaPreview.notasEspeciales">
            <p class="font-semibold">Notas Especiales:</p>
            <p>{{ recetaPreview.notasEspeciales }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RecipesPage implements OnInit {
  recetaForm: FormGroup;
  recetaGenerada = false;
  recetaPreview: any = {};
  recetaGeneradaId: string = '';

  // Datos de ejemplo
  codigoHospital = '00256';

  pacientes: any[] = [];
  doctorActual: any = null;
  principiosActivos: any[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Inicializar formulario
    this.recetaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      paciente: ['', Validators.required],
      nombreMedico: ['', Validators.required],
      numeroColegiado: ['', Validators.required],
      especialidad: ['', Validators.required],
      tieneSeguro: [false],
      codigoSeguro: [''],
      medicamento: this.fb.group({
        principioActivo: ['', Validators.required],
        concentracion: ['', Validators.required],
        presentacion: ['', Validators.required],
        formaFarmaceutica: ['', Validators.required],
        dosis: ['', Validators.required],
        frecuencia: ['', Validators.required],
        duracion: ['', Validators.required],
        diagnostico: ['', Validators.required],
      }),
      notasEspeciales: [''],
    });

    // Validar código de seguro cuando se activa
    this.recetaForm
      .get('tieneSeguro')
      ?.valueChanges.subscribe((tieneSeguro) => {
        const codigoSeguroControl = this.recetaForm.get('codigoSeguro');
        if (tieneSeguro) {
          codigoSeguroControl?.setValidators(Validators.required);
        } else {
          codigoSeguroControl?.clearValidators();
        }
        codigoSeguroControl?.updateValueAndValidity();
      });
  }

  generarPDF(recetaData: any): void {
    const doc = new jsPDF();
    const rows = [
      ['Paciente', recetaData.paciente],
      ['Nombre Médico', recetaData.nombreMedico],
      ['Tiene Seguro', recetaData.tieneSeguro ? 'Sí' : 'No'],
      ['Código Seguro', recetaData.codigoSeguro || 'N/A'],
      ['Código Hospital', recetaData.codigoHospital],
      ['Principio Activo', recetaData.medicamento.principioActivo],
      ['Concentracion', recetaData.medicamento.concentracion],
      ['Presentación', recetaData.medicamento.presentacion],
      ['Forma Farmacéutica', recetaData.medicamento.formaFarmaceutica],
      ['Dosis', recetaData.medicamento.dosis],
      ['Frecuencia', recetaData.medicamento.frecuencia],
      ['Duración', recetaData.medicamento.duracion],
      ['Diagnóstico', recetaData.medicamento.diagnostico],
      ['Notas Especiales', recetaData.notasEspeciales || ''],
    ];
    autoTable(doc, {
      head: [['Campo', 'Valor']],
      body: rows,
      startY: 20,
    });
    doc.save('prescription.pdf');
  }

  ngOnInit(): void {
    // Cargar el doctor actual
    this.cargarDoctorActual();

    // Cargar los pacientes
    this.cargarPacientes();

    // Cargar los principios activos
    this.cargarPrincipiosActivos();
  }

  cargarDoctorActual(): void {
    // Para pruebas, puedes pasar el ID como parámetro
    // En producción, el backend debería obtener el ID del token/sesión
    const doctorId = '67cd3224d8c7c0ed8f0c01fe'; // Este ID debería venir de tu sistema de autenticación

    this.http
      .get<DoctorResponse>(
        `http://127.0.0.1:8000/users/current-doctor?doctor_id=${doctorId}`
      )
      .subscribe({
        next: (response) => {
          this.doctorActual = response.doctor;
          console.log('Doctor cargado:', this.doctorActual);

          // Actualizar el formulario con los datos del doctor
          this.recetaForm.patchValue({
            nombreMedico: this.doctorActual._id, // Guardamos el ID, no el nombre
            numeroColegiado:
              this.doctorActual.noLicencia ||
              'MED-' + Math.floor(Math.random() * 10000),
            especialidad: this.doctorActual.especialidad || 'Medicina General',
          });
        },
        error: (error) => {
          console.error('Error al cargar el doctor:', error);
        },
      });
  }

  cargarPacientes(): void {
    this.http.get<ApiResponse>('http://127.0.0.1:8000/users').subscribe({
      next: (response) => {
        this.pacientes = response.appointments.filter(
          (user: User) => user.rol === 'paciente'
        );
        console.log('Pacientes cargados:', this.pacientes);
      },
      error: (error) => {
        console.error('Error al cargar los pacientes:', error);
      },
    });
  }

  cargarPrincipiosActivos(): void {
    this.http
      .get<any>('http://127.0.0.1:8000/medicines/principios-activos')
      .subscribe({
        next: (response) => {
          this.principiosActivos = response.principios_activos;
          console.log('Principios activos cargados:', this.principiosActivos);
        },
        error: (error) => {
          console.error('Error al cargar los principios activos:', error);
        },
      });
  }

  generarReceta(): void {
    if (this.recetaForm.valid) {
      const formData = this.recetaForm.value;

      // Crear objeto para enviar al API
      const recetaData = {
        paciente: formData.paciente, // Ahora esto contiene el ID del paciente
        nombreMedico: formData.nombreMedico, // ID del médico
        tieneSeguro: formData.tieneSeguro,
        codigoSeguro: formData.tieneSeguro ? formData.codigoSeguro : null,
        codigoHospital: this.codigoHospital,
        medicamento: {
          principioActivo: formData.medicamento.principioActivo,
          concentracion: formData.medicamento.concentracion,
          presentacion: formData.medicamento.presentacion,
          formaFarmaceutica: formData.medicamento.formaFarmaceutica,
          dosis: formData.medicamento.dosis,
          frecuencia: formData.medicamento.frecuencia,
          duracion: formData.medicamento.duracion,
          diagnostico: formData.medicamento.diagnostico,
        },

        notasEspeciales: formData.notasEspeciales,
      };
      this.generarPDF(recetaData);

      console.log('Datos a enviar:', recetaData);

      // Enviar datos al API
      this.http
        .post('http://127.0.0.1:8000/recipes/save', recetaData)
        .subscribe({
          next: (response: any) => {
            console.log('Receta guardada:', response);

            // Guardar el ID de la receta generada
            this.recetaGeneradaId = response.recipe_id;

            // Para la vista previa, buscar el nombre del paciente según su ID
            const pacienteSeleccionado = this.pacientes.find(
              (p) => p._id === formData.paciente
            );

            // Crear objeto de receta para vista previa
            this.recetaPreview = {
              ...formData,
              codigo: response.code,
              fecha: new Date(formData.fecha),
              // Mostrar nombres en la vista previa
              nombreMedico: this.doctorActual?.username || 'Médico',
              paciente: pacienteSeleccionado?.username || 'Paciente',
            };

            this.recetaGenerada = true;
          },
          error: (error) => {
            console.error('Error al guardar la receta:', error);
            alert(
              'Error al guardar la receta: ' +
                (error.error?.error || 'Error desconocido')
            );
          },
        });
    }
  }

  cancelar(): void {
    this.recetaForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      nombreMedico: '',
      numeroColegiado: '',
      especialidad: '',
      tieneSeguro: false,
    });
    this.recetaGenerada = false;
  }

  // Método para generar un ID único (ejemplo simplificado)
  generarIdUnico(): string {
    return (
      '1000' +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
    );
  }

  // Método para enviar la receta por email
  enviarPorEmail(): void {
    if (!this.recetaGeneradaId) {
      alert('No hay una receta generada para enviar');
      return;
    }

    this.http
      .post(
        `http://127.0.0.1:8000/recipes/send-email/${this.recetaGeneradaId}`,
        {}
      )
      .subscribe({
        next: (response: any) => {
          console.log('Receta enviada por email:', response);
          alert('Receta enviada por email correctamente');
        },
        error: (error) => {
          console.error('Error al enviar la receta por email:', error);
          alert(
            'Error al enviar la receta por email: ' +
              (error.error?.error || 'Error desconocido')
          );
        },
      });
  }
}
