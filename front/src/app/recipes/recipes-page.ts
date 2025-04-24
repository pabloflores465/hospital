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
import { back_url } from '../../environments/back_url';

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
      <h1 class="text-2xl font-bold mb-4">Recetas Médicas</h1>

      <!-- Lista de Recetas -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Mis Recetas</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let receta of recetas"
            class="bg-white rounded-lg shadow p-4"
          >
            <div class="border-b pb-2 mb-2">
              <p class="font-semibold">
                Fecha: {{ receta.fecha | date : 'dd/MM/yyyy' }}
              </p>
              <p>Código: {{ receta.codigo }}</p>
            </div>
            <div class="mb-2">
              <p class="font-medium">Médico: {{ receta.nombreMedico }}</p>
              <p>Especialidad: {{ receta.especialidad }}</p>
            </div>
            <div class="mb-2">
              <h3 class="font-medium">Medicamentos:</h3>
              <ul class="list-disc list-inside">
                <li *ngFor="let medicamento of receta.medicamentos">
                  {{ medicamento.principioActivo }} - {{ medicamento.dosis }}
                </li>
              </ul>
            </div>
            <div class="flex justify-end space-x-2">
              <button
                (click)="generarPDF(receta)"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario de Generación de Receta -->
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
                  (change)="seleccionarMedicamento()"
                >
                  <option value="">Seleccione un principio activo</option>
                  <option
                    *ngFor="let principio of principiosActivos"
                    [value]="principio.name || principio.activeMedicament"
                  >
                    {{ principio.activeMedicament || principio.name }}
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
  tienePolicaDisponible: boolean = false;

  // Datos de ejemplo
  codigoHospital = '00256';

  pacientes: any[] = [];
  doctorActual: any = null;
  principiosActivos: any[] = [];
  recetas: any[] = [];

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
    this.cargarDoctorActual();
    this.cargarPacientes();
    this.cargarPrincipiosActivos();
    this.cargarRecetas();

    // Por defecto, el checkbox de tieneSeguro está deshabilitado hasta verificar póliza
    this.recetaForm.get('tieneSeguro')?.disable();

    // Obtener información del usuario y verificar póliza
    this.verificarPolizaUsuario();

    // Agregar listener para el cambio de paciente
    this.recetaForm.get('paciente')?.valueChanges.subscribe((idPaciente) => {
      if (idPaciente) {
        // Deshabilitar el checkbox hasta verificar si tiene póliza
        this.recetaForm.get('tieneSeguro')?.disable();
        this.recetaForm.patchValue({ tieneSeguro: false, codigoSeguro: '' });
        this.verificarPolizaPacienteSeleccionado(idPaciente);
      } else {
        // Si no hay paciente seleccionado, deshabilitar la opción de seguro
        this.tienePolicaDisponible = false;
        this.recetaForm.get('tieneSeguro')?.disable();
        this.recetaForm.patchValue({ tieneSeguro: false, codigoSeguro: '' });
      }
    });
  }

  async cargarDoctorActual(): Promise<void> {
    // Para pruebas, puedes pasar el ID como parámetro
    // En producción, el backend debería obtener el ID del token/sesión
    const doctorId = '67cd3224d8c7c0ed8f0c01fe'; // Este ID debería venir de tu sistema de autenticación

    const url = await back_url();
    this.http
      .get<DoctorResponse>(`${url}/users/current-doctor?doctor_id=${doctorId}`)
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

  async cargarPacientes(): Promise<void> {
    const url = await back_url();
    this.http.get<ApiResponse>(`${url}/users`).subscribe({
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

  async cargarPrincipiosActivos(): Promise<void> {
    // Usar la API externa proporcionada para obtener los medicamentos
    this.http.get<any>('http://172.16.57.55:8081/api2/medicines').subscribe({
      next: (response) => {
        // Guardar la respuesta en la variable principiosActivos
        this.principiosActivos = response || [];
        console.log('Principios activos cargados:', this.principiosActivos);
      },
      error: (error) => {
        console.error('Error al cargar los principios activos:', error);
        // En caso de error, intentar cargar desde la API local como respaldo
        this.cargarPrincipiosActivosLocal();
      },
    });
  }

  async cargarPrincipiosActivosLocal(): Promise<void> {
    const url = await back_url();
    this.http.get<any>(`${url}/medicines/principios-activos`).subscribe({
      next: (response) => {
        this.principiosActivos = response.principios_activos || [];
        console.log('Principios activos cargados (local):', this.principiosActivos);
      },
      error: (error) => {
        console.error('Error al cargar los principios activos locales:', error);
      },
    });
  }

  async cargarRecetas(): Promise<void> {
    const url = await back_url();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol === 'patient') {
      // Si es paciente, cargar solo sus recetas
      this.http.get(`${url}/recetas/usuario/${user._id}`).subscribe({
        next: (response: any) => {
          this.recetas = response;
        },
        error: (error) => {
          console.error('Error al cargar las recetas:', error);
        },
      });
    } else if (user.rol === 'doctor') {
      // Si es doctor, cargar las recetas que ha generado
      this.http.get(`${url}/recipes/doctor/${user._id}`).subscribe({
        next: (response: any) => {
          this.recetas = response;
        },
        error: (error) => {
          console.error('Error al cargar las recetas:', error);
        },
      });
    }
  }

  async generarReceta(): Promise<void> {
    const url = await back_url();
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
      this.http.post(`${url}/recipes/save`, recetaData).subscribe({
        next: (response: any) => {
          console.log('Receta guardada:', response);

          // Guardar el ID de la receta generada
          this.recetaGeneradaId = response.recipe_id;

          // Enviar automáticamente por email
          this.http
            .post(`${url}/recipes/send-email/${this.recetaGeneradaId}`, {})
            .subscribe({
              next: () => {
                console.log('Receta enviada por email exitosamente');
                alert(
                  'La receta ha sido guardada y enviada al correo del paciente.'
                );
              },
              error: (err) => {
                console.error('Error al enviar el email:', err);
                alert(
                  'La receta se guardó correctamente, pero hubo un error al enviar el correo.'
                );
              },
            });

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
  async enviarPorEmail(): Promise<void> {
    const url = await back_url();
    if (!this.recetaGeneradaId) {
      alert('No hay una receta generada para enviar');
      return;
    }

    this.http
      .post(`${url}/recipes/send-email/${this.recetaGeneradaId}`, {})
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

  /**
   * Verifica la póliza del usuario actual obteniendo su correo del localStorage
   * y consultando la API para obtener su información completa
   */
  async verificarPolizaUsuario(): Promise<void> {
    try {
      // Obtener el correo electrónico del usuario del localStorage
      const userData = localStorage.getItem('hospital_user');
      if (!userData) {
        console.error('No se encontró información del usuario en localStorage');
        return;
      }

      const user = JSON.parse(userData);
      const email = user.email;

      if (!email) {
        console.error('No se encontró email del usuario en localStorage');
        return;
      }

      // Consultar la API para obtener información del usuario por su email
      this.http
        .get<any>(`http://192.168.0.20:8080/api/users/by-email/${encodeURIComponent(email)}`)
        .subscribe({
          next: (response: any) => {
            console.log('Usuario obtenido:', response);

            if (response) {
              // Verificar si el usuario tiene póliza
              if (response.policy) {
                // Automáticamente marcar que tiene seguro y poner el número de póliza
                this.tienePolicaDisponible = true;
                this.recetaForm.patchValue({
                  tieneSeguro: true,
                  codigoSeguro: response.policy.idPolicy.toString(),
                });
                console.log(
                  'Usuario tiene póliza, ID:',
                  response.policy.idPolicy
                );
              } else {
                // Si no tiene póliza, desmarcamos la casilla y deshabilitamos la opción
                this.tienePolicaDisponible = false;
                this.recetaForm.patchValue({
                  tieneSeguro: false,
                  codigoSeguro: '',
                });
                // Deshabilitar el control de tieneSeguro
                this.recetaForm.get('tieneSeguro')?.disable();
                console.log('Usuario no tiene póliza');
              }
            } else {
              // No se encontró el usuario, deshabilitamos la opción de seguro
              this.tienePolicaDisponible = false;
              this.recetaForm.patchValue({
                tieneSeguro: false,
                codigoSeguro: '',
              });
              // Deshabilitar el control de tieneSeguro
              this.recetaForm.get('tieneSeguro')?.disable();
              console.error(
                'No se encontró ningún usuario con el email:',
                email
              );
            }
          },
          error: (error) => {
            // En caso de error, deshabilitamos la opción de seguro
            this.tienePolicaDisponible = false;
            this.recetaForm.get('tieneSeguro')?.disable();
            console.error('Error al obtener información del usuario:', error);
          },
        });
    } catch (error) {
      // En caso de error, deshabilitamos la opción de seguro
      this.tienePolicaDisponible = false;
      this.recetaForm.get('tieneSeguro')?.disable();
      console.error('Error al verificar póliza del usuario:', error);
    }
  }

  /**
   * Verifica la póliza del paciente seleccionado
   * @param idPaciente ID del paciente seleccionado en el formulario
   */
  verificarPolizaPacienteSeleccionado(idPaciente: string): void {
    try {
      // Buscar el paciente en la lista de pacientes cargados
      const pacienteSeleccionado = this.pacientes.find(
        (p) => p._id === idPaciente
      );

      if (!pacienteSeleccionado) {
        console.error('No se encontró el paciente con ID:', idPaciente);
        return;
      }

      const emailPaciente = pacienteSeleccionado.email;

      if (!emailPaciente) {
        console.error('El paciente no tiene email registrado');
        return;
      }

      console.log(
        'Verificando póliza para el paciente:',
        pacienteSeleccionado.username,
        'con email:',
        emailPaciente
      );

      // Consultar la API para obtener información del usuario por su email
      this.http
        .get<any>(`http://172.16.57.55:8080/api/users/by-email/${encodeURIComponent(emailPaciente)}`)
        .subscribe({
          next: (response: any) => {
            if (response) {
              console.log(
                'Usuario encontrado en API externa:',
                response
              );

              // Verificar si el usuario tiene póliza
              if (response.policy) {
                // Automáticamente marcar que tiene seguro y poner el número de póliza
                this.tienePolicaDisponible = true;
                // Habilitamos el control tieneSeguro si estaba deshabilitado
                this.recetaForm.get('tieneSeguro')?.enable();
                this.recetaForm.patchValue({
                  tieneSeguro: true,
                  codigoSeguro: response.policy.idPolicy.toString(),
                });
                console.log(
                  'Paciente tiene póliza, ID:',
                  response.policy.idPolicy
                );
              } else {
                // Si no tiene póliza, desmarcamos la casilla y deshabilitamos la opción
                this.tienePolicaDisponible = false;
                this.recetaForm.patchValue({
                  tieneSeguro: false,
                  codigoSeguro: '',
                });
                // Deshabilitar el control de tieneSeguro
                this.recetaForm.get('tieneSeguro')?.disable();
                console.log('Paciente no tiene póliza');
              }
            } else {
              // No se encontró el usuario, deshabilitamos la opción de seguro
              this.tienePolicaDisponible = false;
              this.recetaForm.patchValue({
                tieneSeguro: false,
                codigoSeguro: '',
              });
              // Deshabilitar el control de tieneSeguro
              this.recetaForm.get('tieneSeguro')?.disable();
              console.error(
                'No se encontró ningún usuario con el email:',
                emailPaciente
              );
            }
          },
          error: (error) => {
            // En caso de error, deshabilitamos la opción de seguro
            this.tienePolicaDisponible = false;
            this.recetaForm.get('tieneSeguro')?.disable();
            console.error('Error al obtener información de usuarios:', error);
          },
        });
    } catch (error) {
      // En caso de error, deshabilitamos la opción de seguro
      this.tienePolicaDisponible = false;
      this.recetaForm.get('tieneSeguro')?.disable();
      console.error('Error al verificar póliza del paciente:', error);
    }
  }

  seleccionarMedicamento(): void {
    // Obtener el valor actual del control principioActivo
    const principioActivoSeleccionado = this.recetaForm.get('medicamento.principioActivo')?.value;
    if (!principioActivoSeleccionado) return;
    
    console.log('Principio activo seleccionado:', principioActivoSeleccionado);
    
    // Buscar el medicamento en el array de principiosActivos
    const medicamentoSeleccionado = this.principiosActivos.find(med => 
      med.name === principioActivoSeleccionado || 
      med.activeMedicament === principioActivoSeleccionado
    );
    
    if (medicamentoSeleccionado) {
      console.log('Medicamento encontrado:', medicamentoSeleccionado);
      
      // Actualizar los campos del formulario con la información del medicamento
      this.recetaForm.patchValue({
        medicamento: {
          // Mantener el principio activo seleccionado
          principioActivo: principioActivoSeleccionado,
          // Actualizar concentración si existe
          concentracion: medicamentoSeleccionado.concentration || '',
          // Actualizar presentación si existe
          presentacion: medicamentoSeleccionado.representation || '',
          // Actualizar forma farmacéutica si existe
          formaFarmaceutica: medicamentoSeleccionado.description || ''
        }
      });
    }
  }
}
