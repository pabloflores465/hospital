import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  precio?: number;
  
  // Campos adicionales para cálculos estimados
  mgPorUnidad?: number; // Ej: 100 (si la unidad es tableta/cápsula y la concentración es 100mg)
  unidadesPorPaquete?: number; // Ej: 5 (si vienen en paquetes de 5)
  unidadMedida?: string; // Ej: 'mg', 'ml', 'tableta', 'cápsula' (Detectado de la concentración o forma)
  
  // Nuevos campos para stock
  stockDisponible?: number; // Stock total en unidades (ej: 150 tabletas)
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
                
                <!-- Mostrar siempre el estado de la póliza para depuración -->
                <div class="mt-1 text-xs text-gray-500">
                  Estado de póliza: {{ tienePolicaDisponible ? 'Disponible' : 'No disponible' }}
                </div>
                
                <!-- Mensaje de póliza siempre visible -->
                <div class="mt-2 p-3 bg-green-100 text-green-800 border-2 border-green-300 rounded-lg">
                  <div class="flex items-center">
                    <div class="bg-green-800 text-white rounded-full h-6 w-6 flex items-center justify-center mr-2">
                      <span class="font-bold">✓</span>
                    </div>
                    <span class="font-bold text-lg">Información de póliza</span>
                  </div>
                  <div class="mt-2 flex flex-col">
                    <div>
                      <span class="font-semibold">Estado:</span>
                      <span class="ml-2">{{ tienePolicaDisponible ? 'Activa' : 'No disponible' }}</span>
                    </div>
                    <div *ngIf="tienePolicaDisponible" class="mt-1">
                      <span class="font-semibold">ID de Póliza:</span>
                      <span class="ml-2 text-xl font-bold">{{ recetaForm.get('codigoSeguro')?.value || 'No disponible' }}</span>
                    </div>
                  </div>
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
          <div class="border-b pb-4 mb-4">
            <h2 class="text-xl font-semibold mb-3">
              Información del Medicamento
            </h2>
            <div formGroupName="medicamento">
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
                  <label class="block text-sm font-medium mb-1">Dosis (unidades a aplicar)</label>
                  <input
                    type="text"
                    formControlName="dosis"
                    class="w-full p-2 border rounded"
                    placeholder="Ej: 1 tableta, 10ml, 2 capsulas"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Frecuencia (tiempo entre tomas)</label>
                  <input
                    type="text"
                    formControlName="frecuencia"
                    class="w-full p-2 border rounded"
                    placeholder="Ej: Cada 8 horas, 3 veces al día"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Duración (tiempo total del tratamiento)</label>
                  <input
                    type="text"
                    formControlName="duracion"
                    class="w-full p-2 border rounded"
                    placeholder="Ej: 7 días, 2 semanas, 1 mes"
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
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Precio</label
                  >
                  <input
                    type="number"
                    formControlName="precio"
                    class="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div class="flex justify-end mt-4">
                <button 
                  type="button" 
                  class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  (click)="agregarMedicamento()"
                >
                  Agregar Medicamento
                </button>
              </div>
            </div>
            
            <!-- Lista de medicamentos agregados -->
            <div class="mt-6 border-t pt-4">
              <h3 class="text-lg font-semibold mb-3">Medicamentos en esta Receta</h3>
              <div *ngIf="medicamentosAgregados.length === 0" class="text-gray-500 italic">
                Aún no se han agregado medicamentos.
              </div>
              
              <div *ngIf="medicamentosAgregados.length > 0" class="space-y-3 mb-4">
                <div *ngFor="let med of medicamentosAgregados; let i = index" class="border p-3 rounded-md bg-gray-50 flex justify-between items-start">
                  <div>
                    <p class="font-medium">{{ i + 1 }}. {{ med.principioActivo }} ({{ med.concentracion }})</p>
                    <p class="text-sm">Presentación API: {{ med.presentacion }} | Forma: {{ med.formaFarmaceutica }}</p>
                    <p class="text-sm">Dosis: {{ med.dosis }} | Frecuencia: {{ med.frecuencia }} | Duración: {{ med.duracion }}</p>
                    <!-- Mostrar unidades por paquete detectadas -->
                    <p class="text-sm font-semibold">Precio Paquete ({{ med.unidadesPorPaquete || '??' }} u.): Q{{ formatearPrecio(med.precio || 0) }}</p>
                    
                    <!-- Mostrar Estimados -->
                    <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                      <ng-container *ngIf="calcularEstimadosMedicamento(med) as estimados">
                        <p *ngIf="estimados.totalUnidades !== undefined">
                          <span class="font-semibold">Total Unidades Estimado:</span> {{ estimados.totalUnidades }} {{ med.unidadMedida ? (med.unidadMedida + 's') : 'unidades' }}
                        </p>
                        <p *ngIf="estimados.totalPaquetes !== undefined" class="font-semibold">
                          Total Paquetes Estimado: {{ estimados.totalPaquetes }}
                        </p>
                        <!-- Mostrar Costo Estimado por Línea -->
                        <p *ngIf="calcularCostoMedicamento(med) as costoEstimadoLinea" class="font-bold text-sm text-blue-700">
                          Costo Estimado Línea: Q{{ formatearPrecio(costoEstimadoLinea) }}
                        </p>
                        <!-- Mostrar advertencia de cálculo SOLO si NO hay advertencia de stock -->
                        <p *ngIf="estimados.warnings && estimados.warnings.length > 0 && !getAdvertenciaStock(med)" class="text-orange-600 italic">
                          <span class="font-semibold">Nota Cálculo:</span> {{ estimados.warnings[0] }}
                        </p>
                      </ng-container>
                      <!-- Mostrar Advertencia específica de Stock Insuficiente -->
                      <p *ngIf="getAdvertenciaStock(med) as advertenciaStockMsg" class="text-red-600 font-bold italic mt-1">
                        {{ advertenciaStockMsg }}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    class="text-red-600 hover:text-red-800 ml-4 p-1 rounded hover:bg-red-100 flex-shrink-0"
                    title="Eliminar este medicamento"
                    (click)="eliminarMedicamento(i)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Totales de la receta -->
              <div *ngIf="medicamentosAgregados.length > 0" class="border-t pt-4">
                <h4 class="text-md font-semibold mb-2">Resumen de Costos</h4>
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span>Subtotal Medicamentos:</span>
                    <span class="font-medium">Q{{ formatearPrecio(calcularTotalMedicamentos()) }}</span>
                  </div>
                  <div *ngIf="descuentoAplicado" class="flex justify-between text-green-700">
                    <span>Descuento por Póliza ({{ porcentajeDescuento }}%):</span>
                    <span class="font-medium">-Q{{ formatearPrecio(calcularDescuento()) }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>TOTAL A PAGAR:</span>
                    <span>Q{{ formatearPrecio(calcularTotalConDescuento()) }}</span>
                  </div>
                </div>
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
              [disabled]="recetaForm.invalid && !recetaForm.get('paciente')?.value"
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
            <button 
              class="px-4 py-2 bg-green-600 text-white rounded mr-2"
              (click)="generarPDF(recetaPreview)"
            >
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
            <p class="font-semibold">Medicamentos:</p>
            
            <div *ngFor="let med of recetaPreview.medicamentos" class="mt-2 p-2 bg-gray-50 rounded">
              <p>
                <span class="font-medium">{{ med.principioActivo }}</span> 
                {{ med.concentracion }}
              </p>
              <p>
                {{ med.presentacion }} -
                {{ med.formaFarmaceutica }}
              </p>
              <div class="grid grid-cols-1 gap-1 mt-1 text-sm">
                <p class="font-semibold">Dosis: <span class="font-normal">{{ med.dosis }}</span> <span class="text-xs text-gray-500">(unidades a aplicar)</span></p>
                <p class="font-semibold">Frecuencia: <span class="font-normal">{{ med.frecuencia }}</span> <span class="text-xs text-gray-500">(tiempo entre tomas)</span></p>
                <p class="font-semibold">Duración: <span class="font-normal">{{ med.duracion }}</span> <span class="text-xs text-gray-500">(tiempo total del tratamiento)</span></p>
              </div>
              <p class="mt-1 text-sm"><span class="font-semibold">Diagnóstico:</span> {{ med.diagnostico }}</p>
              <p class="mt-1 text-sm"><span class="font-semibold">Precio:</span> {{ med.precio || 'No especificado' }}</p>
            </div>
            
            <!-- Precio total -->
            <div class="mt-4 border-t pt-3">
              <div class="flex justify-between items-center">
                <span class="font-semibold">Subtotal:</span>
                <span>Q{{ formatearPrecio(calcularPrecioTotal().total) }}</span>
              </div>
              
              <!-- Información de descuento por póliza -->
              <div *ngIf="descuentoAplicado" class="flex justify-between items-center text-green-700 my-1">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Descuento por póliza ({{ porcentajeDescuento }}%):</span>
                </div>
                <span>-Q{{ formatearPrecio(calcularPrecioTotal().descuento) }}</span>
              </div>
              
              <!-- Total con descuento -->
              <div class="flex justify-between items-center font-bold text-lg mt-1 pt-1 border-t">
                <span>TOTAL A PAGAR:</span>
                <span class="text-xl">Q{{ formatearPrecio(calcularPrecioTotal().totalConDescuento) }}</span>
              </div>
            </div>
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
  
  // Variables para el descuento por póliza
  porcentajeDescuento: number = 15; // 15% de descuento por defecto
  descuentoAplicado: boolean = false;

  // Datos de ejemplo
  codigoHospital = '00256';

  pacientes: any[] = [];
  doctorActual: any = null;
  principiosActivos: any[] = [];
  recetas: any[] = [];
  medicamentosAgregados: Medicamento[] = [];

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
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
        principioActivo: [''],
        concentracion: [''],
        presentacion: [''],
        formaFarmaceutica: [''],
        dosis: [''],
        frecuencia: [''],
        duracion: [''],
        diagnostico: [''],
        precio: [''],
        // AÑADIR campos cruciales para los cálculos:
        unidadesPorPaquete: [null],
        stockDisponible: [null],
        unidadMedida: ['']
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
      
    // AÑADIR: Log de inicialización
    console.log('[Init] Formulario inicializado con unidadesPorPaquete en medicamento:', 
      this.recetaForm.get('medicamento.unidadesPorPaquete') !== null);
  }

  generarPDF(recetaData: any): void {
    const doc = new jsPDF();
    
    // Cabecera
    doc.setFontSize(18);
    doc.text('Receta Médica', 105, 15, { align: 'center' });
    
    // Información general
    doc.setFontSize(12);
    const infoGeneral = [
      ['Paciente', recetaData.paciente],
      ['Médico', recetaData.nombreMedico],
      ['Especialidad', recetaData.especialidad || 'No especificada'],
      ['Fecha', new Date().toLocaleDateString()],
      ['Código', recetaData.codigo || ''],
      ['Tiene Seguro', recetaData.tieneSeguro ? 'Sí' : 'No'],
      ['Código Seguro', recetaData.codigoSeguro || 'N/A'],
      ['Código Hospital', recetaData.codigoHospital || ''],
    ];
    
    autoTable(doc, {
      head: [['Campo', 'Valor']],
      body: infoGeneral,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Tabla de medicamentos
    const medicamentosRows = [];
    let totalPrecio = 0;
    let totalUnidades = 0;
    let totalPaquetes = 0;
    
    // Si tenemos un solo objeto de medicamento (compatibilidad con versión anterior)
    if (recetaData.medicamento) {
      const med = recetaData.medicamento;
      
      // Calcular estimados si no están presentes
      let estimadoUnidades = med.estimadoUnidades;
      let estimadoPaquetes = med.estimadoPaquetes;
      
      if (estimadoUnidades === undefined || estimadoPaquetes === undefined) {
        const estimados = this.calcularEstimadosMedicamento(med);
        estimadoUnidades = estimados.totalUnidades || 0;
        estimadoPaquetes = estimados.totalPaquetes || 1;
      }
      
      // Actualizar totales
      totalUnidades += estimadoUnidades;
      totalPaquetes += estimadoPaquetes;
      
      medicamentosRows.push([
        med.principioActivo,
        med.concentracion,
        med.dosis + " (por toma)",
        med.frecuencia + " (entre tomas)",
        med.duracion + " (tratamiento)",
        med.precio ? `Q${parseFloat(med.precio.toString()).toFixed(2)}` : 'N/A',
        // NUEVO: Añadir columnas de unidades y paquetes
        estimadoUnidades.toString(),
        estimadoPaquetes.toString()
      ]);
      if (med.precio) {
        totalPrecio += parseFloat(med.precio.toString());
      }
    }
    // Si tenemos un array de medicamentos
    else if (recetaData.medicamentos && Array.isArray(recetaData.medicamentos)) {
      recetaData.medicamentos.forEach((med: Medicamento & {estimadoUnidades?: number, estimadoPaquetes?: number}) => {
        // Calcular estimados si no están presentes
        let estimadoUnidades = med.estimadoUnidades;
        let estimadoPaquetes = med.estimadoPaquetes;
        
        if (estimadoUnidades === undefined || estimadoPaquetes === undefined) {
          const estimados = this.calcularEstimadosMedicamento(med);
          estimadoUnidades = estimados.totalUnidades || 0;
          estimadoPaquetes = estimados.totalPaquetes || 1;
        }
        
        // Actualizar totales
        totalUnidades += estimadoUnidades;
        totalPaquetes += estimadoPaquetes;
        
        medicamentosRows.push([
          med.principioActivo,
          med.concentracion,
          med.dosis + " (por toma)",
          med.frecuencia + " (entre tomas)",
          med.duracion + " (tratamiento)",
          med.precio ? `Q${parseFloat(med.precio.toString()).toFixed(2)}` : 'N/A',
          // NUEVO: Añadir columnas de unidades y paquetes
          estimadoUnidades.toString(),
          estimadoPaquetes.toString()
        ]);
        if (med.precio) {
          totalPrecio += parseFloat(med.precio.toString());
        }
      });
    }
    
    // Calcular descuento si aplica
    let descuento = 0;
    let totalConDescuento = totalPrecio;
    
    if (recetaData.tieneSeguro) {
      descuento = totalPrecio * (this.porcentajeDescuento / 100);
      totalConDescuento = totalPrecio - descuento;
      
      // Agregar fila de totales para unidades y paquetes
      medicamentosRows.push(['', '', '', '', '', 'TOTALES:', totalUnidades.toString(), totalPaquetes.toString()]);
      
      // Agregar fila de subtotal
      medicamentosRows.push(['', '', '', '', 'SUBTOTAL', `Q${totalPrecio.toFixed(2)}`, '', '']);
      
      // Agregar fila de descuento
      medicamentosRows.push(['', '', '', '', `DESCUENTO (${this.porcentajeDescuento}%)`, `-Q${descuento.toFixed(2)}`, '', '']);
      
      // Agregar fila de total con descuento
      medicamentosRows.push(['', '', '', '', 'TOTAL A PAGAR', `Q${totalConDescuento.toFixed(2)}`, '', '']);
    } else {
      // Si no hay descuento, mostrar los totales y el precio final
      medicamentosRows.push(['', '', '', '', '', 'TOTALES:', totalUnidades.toString(), totalPaquetes.toString()]);
      medicamentosRows.push(['', '', '', '', 'TOTAL', `Q${totalPrecio.toFixed(2)}`, '', '']);
    }
    
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    
    autoTable(doc, {
      head: [['Principio Activo', 'Concentración', 'Dosis', 'Frecuencia', 'Duración', 'Precio', 'Unidades', 'Paquetes']],
      body: medicamentosRows,
      startY: finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Notas especiales
    if (recetaData.notasEspeciales) {
      const notasY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Notas Especiales:', 14, notasY);
      doc.setFontSize(10);
      doc.text(recetaData.notasEspeciales, 14, notasY + 7);
    }
    
    // Guardar el documento
    doc.save('receta_medica.pdf');
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
    this.http.get<any>('http://192.168.0.21:8081/api2/medicines').subscribe({
      next: (response) => {
        // Guardar la respuesta en la variable principiosActivos
        this.principiosActivos = response || [];
        console.log('Principios activos cargados:', this.principiosActivos);
        
        // Imprimir una muestra de datos para inspeccionar la estructura
        if (this.principiosActivos.length > 0) {
          console.log('Muestra de medicamento:', this.principiosActivos[0]);
          console.log('Precio del medicamento:', this.principiosActivos[0].price);
        }
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
    
    console.log('Iniciando generación de receta');
    console.log('Medicamentos agregados:', this.medicamentosAgregados);
    console.log('Estado del formulario:', this.recetaForm.value);
    console.log('Formulario válido:', this.recetaForm.valid);
    
    // Verificar los valores requeridos manualmente
    if (!this.recetaForm.get('paciente')?.value) {
      alert('Debe seleccionar un paciente');
      return;
    }
    
    if (!this.recetaForm.get('fecha')?.value) {
      alert('Debe seleccionar una fecha');
      return;
    }
    
    // Verificar que haya al menos un medicamento agregado
    if (this.medicamentosAgregados.length === 0) {
      // Si no hay medicamentos agregados, pero hay uno en el formulario, agregarlo primero
      const medicamentoActual = this.recetaForm.get('medicamento')?.value;
      if (medicamentoActual && medicamentoActual.principioActivo) {
        this.agregarMedicamento();
      } else {
        alert('Debe agregar al menos un medicamento a la receta');
        return;
      }
    }
    
    try {
      const formData = this.recetaForm.value;
      
      // Calcular información de precios
      const preciosCalculados = this.calcularPrecioTotal();
      
      // NUEVO: Enriquecer los medicamentos con información de cálculos
      const medicamentosEnriquecidos = this.medicamentosAgregados.map(med => {
        // Calcular estimados para cada medicamento
        const estimados = this.calcularEstimadosMedicamento(med);
        const costoMedicamento = this.calcularCostoMedicamento(med);
        
        // Devolver medicamento con datos adicionales
        return {
          ...med,
          // Añadir los datos calculados que podrían faltar
          estimadoUnidades: estimados.totalUnidades || 0,
          estimadoPaquetes: estimados.totalPaquetes || 1,
          costoEstimado: costoMedicamento || med.precio || 0,
          // Asegurar que unidadesPorPaquete esté presente
          unidadesPorPaquete: med.unidadesPorPaquete || 30
        };
      });
      
      // Crear objeto para enviar al API
      const recetaData = {
        paciente: formData.paciente, // ID del paciente
        nombreMedico: formData.nombreMedico, // ID del médico
        tieneSeguro: formData.tieneSeguro || false,
        codigoSeguro: formData.tieneSeguro ? formData.codigoSeguro : null,
        codigoHospital: this.codigoHospital,
        // Convertir el array de medicamentos a un solo medicamento (principal)
        // para mantener compatibilidad con el backend
        medicamento: medicamentosEnriquecidos[0],
        // Incluir también el array completo por si el backend lo soporta
        medicamentos: medicamentosEnriquecidos,
        notasEspeciales: formData.notasEspeciales || '',
        // Información de precio y descuento
        subtotal: preciosCalculados.total,
        porcentajeDescuento: formData.tieneSeguro ? this.porcentajeDescuento : 0,
        descuento: preciosCalculados.descuento,
        totalConDescuento: preciosCalculados.totalConDescuento,
        // NUEVO: Información agregada de todas las recetas
        totalUnidades: medicamentosEnriquecidos.reduce((sum, med) => sum + (med.estimadoUnidades || 0), 0),
        totalPaquetes: medicamentosEnriquecidos.reduce((sum, med) => sum + (med.estimadoPaquetes || 0), 0)
      };
      
      console.log('Datos a enviar:', recetaData);
      
      // Generar PDF primero
      this.generarPDF(recetaData);
      
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
                // Limpiar toda la página después de enviar la receta
                this.limpiarPagina();
              },
              error: (err) => {
                console.error('Error al enviar el email:', err);
                alert(
                  'La receta se guardó correctamente, pero hubo un error al enviar el correo.'
                );
                // Limpiar toda la página incluso si falla el envío de email
                this.limpiarPagina();
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
            // Incluir los medicamentos agregados
            medicamentos: medicamentosEnriquecidos
          };
          
          this.recetaGenerada = true;
          
          // Limpiar la lista de medicamentos después de guardar
          this.medicamentosAgregados = [];
        },
        error: (error) => {
          console.error('Error al guardar la receta:', error);
          console.error('Respuesta de error completa:', error.error);
          
          // Intentar con un formato alternativo si falla el primero
          if (error.status === 400) {
            console.log('Intentando con formato alternativo...');
            
            // Formato alternativo: solo enviamos un medicamento en lugar del array
            const formatoAlternativo = {
              ...recetaData,
              medicamento: medicamentosEnriquecidos[0],
              // Eliminar el array de medicamentos
              medicamentos: undefined
            };
            
            console.log('Enviando con formato alternativo:', formatoAlternativo);
            
            this.http.post(`${url}/recipes/save`, formatoAlternativo).subscribe({
              next: (response: any) => {
                console.log('Receta guardada con formato alternativo:', response);
                alert('¡La receta se ha guardado correctamente!');
                // Limpiar toda la página después de enviar la receta
                this.limpiarPagina();
              },
              error: (err) => {
                console.error('Error al guardar receta con formato alternativo:', err);
                alert(
                  'Error al guardar la receta: ' +
                  (err.error?.error || 'Error desconocido')
                );
              }
            });
          } else {
            alert(
              'Error al guardar la receta: ' +
              (error.error?.error || 'Error desconocido')
            );
          }
        },
      });
    } catch (error) {
      console.error('Error al procesar la receta:', error);
      alert('Error al procesar la receta. Consulte la consola para más detalles.');
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
        .get<any>(`http://192.168.0.21:8080/api/users/by-email/${encodeURIComponent(email)}`)
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
      console.log('[Póliza] Iniciando verificación para paciente ID:', idPaciente);
      
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

      // Resetear estado antes de llamar a la API
      this.tienePolicaDisponible = false;
      this.recetaForm.get('tieneSeguro')?.disable(); // Deshabilitar mientras se verifica
      this.recetaForm.patchValue({
        tieneSeguro: false,
        codigoSeguro: '',
      });
      this.cdr.detectChanges(); // Reflejar el estado deshabilitado inicial

      // Consultar la API
      this.http
        .get<any>(`http://192.168.0.21:8080/api/users/by-email/${encodeURIComponent(emailPaciente)}`)
        .subscribe({
          next: (response: any) => {
            console.log('[Póliza] Respuesta completa de la API:', response);
            
            if (response && response.policy) {
              const policyId = String(response.policy.idPolicy);
              console.log('[Póliza] ID de póliza detectado:', policyId);
              
              // --- Actualización Clave --- 
              // 1. Actualizar el estado PRIMERO
              this.tienePolicaDisponible = true;
              
              // 2. Habilitar el control
              this.recetaForm.get('tieneSeguro')?.enable();
              
              // 3. Actualizar formulario (puede necesitar timeout corto para que Angular lo detecte)
              setTimeout(() => {
                this.recetaForm.patchValue({
                  tieneSeguro: true, // Marcar el checkbox
                  codigoSeguro: policyId
                });
                console.log('[Póliza] Formulario actualizado. Checkbox:', this.recetaForm.get('tieneSeguro')?.value, 'ID:', this.recetaForm.get('codigoSeguro')?.value);
                // 4. Forzar detección de cambios DESPUÉS de actualizar todo
                this.cdr.detectChanges(); 
                console.log('[Póliza] Detección de cambios forzada.');
              }, 50); // Pequeño delay para asegurar la detección
              
            } else {
              console.log('[Póliza] El paciente no tiene póliza según la API o respuesta inválida.');
              this.tienePolicaDisponible = false;
              this.recetaForm.get('tieneSeguro')?.disable();
              this.recetaForm.patchValue({ tieneSeguro: false, codigoSeguro: '' });
              this.cdr.detectChanges(); // Asegurar que se refleje la no disponibilidad
            }
          },
          error: (error) => {
            console.error('[Póliza] Error al obtener información de usuarios:', error);
            this.tienePolicaDisponible = false;
            this.recetaForm.get('tieneSeguro')?.disable();
            this.recetaForm.patchValue({ tieneSeguro: false, codigoSeguro: '' });
            this.cdr.detectChanges(); // Reflejar estado de error
          },
        });
        
    } catch (error) {
       // ... (manejo de error general) ...
       this.cdr.detectChanges(); // Asegurar UI limpia en caso de error
    }
  }

  seleccionarMedicamento(): void {
    const principioActivoSeleccionado = this.recetaForm.get('medicamento.principioActivo')?.value;
    if (!principioActivoSeleccionado) return;
    
    console.log('[Selección] Principio activo seleccionado:', principioActivoSeleccionado);
    
    const medicamentoSeleccionado = this.principiosActivos.find(med => 
      med.name === principioActivoSeleccionado || 
      med.activeMedicament === principioActivoSeleccionado
    );
    
    if (medicamentoSeleccionado) {
      console.log('[Selección] Medicamento encontrado en API:', medicamentoSeleccionado);
      console.log('[Selección] Campos disponibles:', Object.keys(medicamentoSeleccionado));
      
      // MODIFICACIÓN: Mejor extracción de unidades por paquete
      let unidadesPaquete: number | undefined = undefined;
      if (medicamentoSeleccionado.presentacion) {
        // Intenta extraer número como secuencia de dígitos en cualquier parte del string
        const match = medicamentoSeleccionado.presentacion.toString().match(/\d+/);
        if (match) {
          unidadesPaquete = parseInt(match[0], 10);
          console.log(`[Selección] Detectado unidadesPorPaquete (extracción de dígitos): ${unidadesPaquete}`);
        } else if (!isNaN(Number(medicamentoSeleccionado.presentacion))) {
          unidadesPaquete = Number(medicamentoSeleccionado.presentacion);
          console.log(`[Selección] Detectado unidadesPorPaquete (conversión directa): ${unidadesPaquete}`);
        }
      } else if (medicamentoSeleccionado.unitsPerPackage && typeof medicamentoSeleccionado.unitsPerPackage === 'number') {
          unidadesPaquete = medicamentoSeleccionado.unitsPerPackage;
          console.log(`[Selección] Detectado unidadesPorPaquete (desde unitsPerPackage): ${unidadesPaquete}`);
      } else if (medicamentoSeleccionado.packageSize && typeof medicamentoSeleccionado.packageSize === 'number') {
          unidadesPaquete = medicamentoSeleccionado.packageSize;
          console.log(`[Selección] Detectado unidadesPorPaquete (desde packageSize): ${unidadesPaquete}`);
      }
      
      // CASO ESPECIAL: Forzar valor para medicamentos comunes
      if ((principioActivoSeleccionado === 'Paracetamol' || 
           principioActivoSeleccionado.includes('Paracetamol') || 
           principioActivoSeleccionado.includes('paracetamol')) && !unidadesPaquete) {
          unidadesPaquete = 30; // Forzar 30 unidades por paquete para Paracetamol
          console.log(`[Selección] *** FORZANDO unidadesPorPaquete=30 para Paracetamol ***`);
      }
      
      // ASEGURARSE que el campo unidadesPorPaquete existe en el FormGroup
      if (!this.recetaForm.get('medicamento.unidadesPorPaquete')) {
        // AÑADIR dinámicamente el control si no existe
        (this.recetaForm.get('medicamento') as FormGroup).addControl('unidadesPorPaquete', this.fb.control(unidadesPaquete));
        console.log('[Selección] Se ha añadido dinámicamente el control unidadesPorPaquete al FormGroup');
      }
      
      // ... resto del código existente para stockDisponible y otros campos ...
      
      // Intenta extraer stock disponible (Usando campo 'stock')
      let stockDisponible: number | undefined = undefined;
      if (medicamentoSeleccionado.stock && typeof medicamentoSeleccionado.stock === 'number') {
          stockDisponible = medicamentoSeleccionado.stock;
          console.log(`[Selección] Detectado stockDisponible (desde stock): ${stockDisponible}`);
      } else if (medicamentoSeleccionado.quantity && typeof medicamentoSeleccionado.quantity === 'number') { // Otra opción común
          stockDisponible = medicamentoSeleccionado.quantity;
          console.log(`[Selección] Detectado stockDisponible (desde quantity): ${stockDisponible}`);
      } else if (medicamentoSeleccionado.availableUnits && typeof medicamentoSeleccionado.availableUnits === 'number') { // Otra opción común
          stockDisponible = medicamentoSeleccionado.availableUnits;
          console.log(`[Selección] Detectado stockDisponible (desde availableUnits): ${stockDisponible}`);
      }

      // Determinar unidad de medida principal estimada (simplificado)
      let unidadMedida: string | undefined = undefined;
      if (medicamentoSeleccionado.formaFarmaceutica?.toLowerCase().includes('tablet') || 
          medicamentoSeleccionado.description?.toLowerCase().includes('tablet')) {
          unidadMedida = 'tableta';
      } // ... añadir más lógica si es necesario para cápsula, ml, etc.
      console.log(`[Selección] Unidad de medida principal estimada: ${unidadMedida}`);

      // Extracción de precio (Asumiendo que 'price' es por paquete)
      let precioPaquete: number | undefined = undefined;
      if (medicamentoSeleccionado.price && typeof medicamentoSeleccionado.price === 'number') {
        precioPaquete = medicamentoSeleccionado.price;
      } else if (medicamentoSeleccionado.pricing && typeof medicamentoSeleccionado.pricing === 'number') {
        precioPaquete = medicamentoSeleccionado.pricing;
      } // ... añadir más lógica si es necesario
      console.log(`[Selección] Precio detectado (asumido por paquete): ${precioPaquete}`);

      // <<< Log de Verificación Antes de PatchValue >>>
      console.log(`[Selección] Valores a parchear -> unidadesPorPaquete: ${unidadesPaquete}, stockDisponible: ${stockDisponible}, precioPaquete: ${precioPaquete}`);

      // Actualizar el formulario con todos los datos
      this.recetaForm.get('medicamento')?.patchValue({
        principioActivo: principioActivoSeleccionado,
        concentracion: medicamentoSeleccionado.concentration || '', // Mantener concentración original
        presentacion: medicamentoSeleccionado.presentacion || '', // Mantener presentación original
        formaFarmaceutica: medicamentoSeleccionado.description || '', // Usar description como forma
        precio: precioPaquete, // Guardar el precio POR PAQUETE
        unidadesPorPaquete: unidadesPaquete,
        stockDisponible: stockDisponible,
        unidadMedida: unidadMedida 
        // mgPorUnidad ya no es necesario aquí
      });
      
      // IMPORTANTE: Verificar que unidadesPorPaquete se haya configurado correctamente
      console.log('[Selección] Verificando que unidadesPorPaquete se haya configurado en el formulario:', 
        this.recetaForm.get('medicamento.unidadesPorPaquete')?.value);
    } else {
      console.log('[Selección] Medicamento no encontrado en la lista local.');
    }
  }

  agregarMedicamento(): void {
    console.log('Intentando agregar medicamento...');
    const medicamentoForm = this.recetaForm.get('medicamento');
    
    // <<< Log de Verificación al Leer del Formulario >>>
    console.log('[Agregar Med] Valores leídos del form:', medicamentoForm?.value);
    if (!medicamentoForm) {
      console.error('Error: No se encontró el grupo de formulario de medicamento.');
      alert('Error interno al agregar medicamento. Intente de nuevo.');
      return;
    }
    
    // Validaciones básicas
    if (!medicamentoForm.value.principioActivo) {
      alert('Debe seleccionar un principio activo.');
      return;
    }
    if (!medicamentoForm.value.dosis) {
      alert('Debe especificar la dosis.');
      return;
    }
    if (!medicamentoForm.value.frecuencia) {
      alert('Debe especificar la frecuencia.');
      return;
    }
    if (!medicamentoForm.value.duracion) {
      alert('Debe especificar la duración del tratamiento.');
      return;
    }
    
    // VERIFICACIÓN ADICIONAL: Si es Paracetamol y unidadesPorPaquete es undefined, forzar a 30
    let unidadesPorPaqueteVal = medicamentoForm.value.unidadesPorPaquete;
    if (medicamentoForm.value.principioActivo.includes('Paracetamol') && !unidadesPorPaqueteVal) {
      unidadesPorPaqueteVal = 30;
      console.log('[Agregar Med] FORZANDO unidadesPorPaquete=30 para Paracetamol');
    }
    
    // Crear objeto Medicamento
    const nuevoMedicamento: Medicamento = {
      principioActivo: medicamentoForm.value.principioActivo || '',
      concentracion: medicamentoForm.value.concentracion || '',
      presentacion: medicamentoForm.value.presentacion || '', // Guardamos el string original de presentación
      formaFarmaceutica: medicamentoForm.value.formaFarmaceutica || '',
      dosis: medicamentoForm.value.dosis || '',
      frecuencia: medicamentoForm.value.frecuencia || '',
      duracion: medicamentoForm.value.duracion || '',
      diagnostico: medicamentoForm.value.diagnostico || '',
      precio: medicamentoForm.value.precio, // Precio POR PAQUETE
      unidadesPorPaquete: unidadesPorPaqueteVal, // Número de unidades por paquete
      stockDisponible: medicamentoForm.value.stockDisponible, // Stock total en UNIDADES
      unidadMedida: medicamentoForm.value.unidadMedida // Ej: 'tableta'
      // mgPorUnidad ya no es necesario aquí
    };
    
    // <<< Log de Verificación Después de Crear Objeto >>>
    console.log(`[Agregar Med] Objeto creado -> unidadesPorPaquete: ${nuevoMedicamento.unidadesPorPaquete}`);

    // --- Verificación de Stock --- 
    const reservaStock = 10;
    let stockAdvertencia: string | null = null;
    let agregarMed = true; // Controlar si se debe agregar
    
    if (nuevoMedicamento.stockDisponible !== undefined) {
      console.log(`[Stock Check] Stock reportado por API: ${nuevoMedicamento.stockDisponible}`);
      const estimados = this.calcularEstimadosMedicamento(nuevoMedicamento);
      
      if (estimados.totalUnidades !== undefined) {
        const stockUtil = nuevoMedicamento.stockDisponible - reservaStock;
        console.log(`[Stock Check] Unidades requeridas: ${estimados.totalUnidades}, Stock útil (menos reserva ${reservaStock}): ${stockUtil}`);
        if (stockUtil < estimados.totalUnidades) {
          stockAdvertencia = `¡Stock Insuficiente! Se requieren ${estimados.totalUnidades} unidades, disponibles ~${stockUtil}. Ajuste la duración o busque alternativa.`;
          console.warn('[Stock Check] Advertencia:', stockAdvertencia);
          alert(stockAdvertencia); // Alerta inmediata al usuario
          // NO agregamos el medicamento si no hay stock suficiente, para evitar confusión.
          // El médico debe ajustar la prescripción.
          // agregarMed = false; // Descomentar si quieres PREVENIR que se añada
        }
      } else {
        console.log('[Stock Check] No se pudo calcular unidades requeridas para verificar stock.');
      }
    } else {
      console.log('[Stock Check] No hay información de stock disponible para este medicamento.');
    }
    // --- Fin Verificación de Stock ---

    // Solo agregar si no se previno por stock (si descomentaste la línea de arriba)
    if (agregarMed) {
      console.log('Agregando medicamento al array:', nuevoMedicamento);
      this.medicamentosAgregados.push(nuevoMedicamento);
      
      // Limpiar el formulario
      medicamentoForm.reset();
      
      // Actualizar UI
      this.cdr.detectChanges();
      
      console.log('Medicamento agregado. Lista actual:', this.medicamentosAgregados);
       // Podemos quitar la alerta genérica si la de stock es suficiente
       // alert('Medicamento agregado a la receta exitosamente.');
       
       // Si hubo advertencia de stock, añadirla a la visualización del medicamento
       // Esto requiere pasar la advertencia. Modificaremos calcularEstimadosMedicamento
       // para que pueda incluir esta advertencia si se pasa como argumento.
       if (stockAdvertencia && this.medicamentosAgregados.length > 0) {
           // Añadir temporalmente la advertencia al último medicamento agregado para mostrarla
           // Idealmente, el objeto estimado debería llevar la advertencia final.
           (this.medicamentosAgregados[this.medicamentosAgregados.length - 1] as any).advertenciaStock = stockAdvertencia;
           this.cdr.detectChanges(); // Volver a detectar para mostrar la advertencia
       }
       
    } else {
      console.log('[Stock Check] Adición del medicamento prevenida por stock insuficiente.');
    }
  }

  eliminarMedicamento(index: number): void {
    this.medicamentosAgregados.splice(index, 1);
  }

  calcularPrecioTotal(): { total: number, descuento: number, totalConDescuento: number } {
    let total = 0;
    if (this.recetaPreview && this.recetaPreview.medicamentos) {
      this.recetaPreview.medicamentos.forEach((med: Medicamento) => {
        if (med.precio) {
          total += parseFloat(med.precio.toString());
        }
      });
    }
    
    // Calcular descuento si el paciente tiene póliza y está habilitado
    let descuento = 0;
    let totalConDescuento = total;
    
    if (this.tienePolicaDisponible && this.recetaForm.get('tieneSeguro')?.value) {
      descuento = total * (this.porcentajeDescuento / 100);
      totalConDescuento = total - descuento;
      this.descuentoAplicado = true;
    } else {
      this.descuentoAplicado = false;
    }
    
    return { 
      total: total, 
      descuento: descuento, 
      totalConDescuento: totalConDescuento 
    };
  }

  // Función para formatear precios
  formatearPrecio(valor: number): string {
    return valor.toFixed(2);
  }

  // Calcular el SUBtotal de la receta sumando costos por línea
  calcularTotalMedicamentos(): number {
    return this.medicamentosAgregados.reduce((total, med) => {
      const costoLinea = this.calcularCostoMedicamento(med);
      return total + (costoLinea !== null ? costoLinea : 0);
    }, 0);
  }

  // Calcular el monto del descuento sobre el subtotal calculado
  calcularDescuento(): number {
    const subtotal = this.calcularTotalMedicamentos(); // Ya usa la suma de costos por línea
    if (this.tienePolicaDisponible && this.recetaForm.get('tieneSeguro')?.value) {
      this.descuentoAplicado = true; // Marcar que se aplica
      return subtotal * (this.porcentajeDescuento / 100);
    }
    this.descuentoAplicado = false; // Marcar que NO se aplica
    return 0;
  }

  // Calcular el total final con descuento aplicado
  calcularTotalConDescuento(): number {
    const subtotal = this.calcularTotalMedicamentos(); // Ya usa la suma de costos por línea
    const descuento = this.calcularDescuento(); // Este ya considera si aplica o no
    return subtotal - descuento;
  }

  /**
   * Limpia toda la página después de enviar una receta
   */
  limpiarPagina(): void {
    // Reiniciar el formulario completo
    this.recetaForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      tieneSeguro: false,
    });
    
    // Limpiar medicamentos agregados
    this.medicamentosAgregados = [];
    
    // Ocultar vista previa
    this.recetaGenerada = false;
    
    // Recargar los datos para la nueva receta
    this.cargarDoctorActual();
    this.cargarPacientes();
    
    // Limpiar el formulario de medicamento
    this.recetaForm.get('medicamento')?.reset();
    
    console.log('Página limpiada correctamente');
  }

  // --- Funciones para Cálculos Estimados ---

  // Intenta parsear la cantidad numérica de una dosis (Ej: "200mg" -> 200, "1 tableta" -> 1)
  private parseDosisNumerica(dosisString: string): number | null {
    if (!dosisString) return null;
    const str = dosisString.trim();
    // Intenta primero si es solo un número
    const numOnly = str.match(/^(\d+(\.\d+)?)$/);
    if (numOnly) {
      return parseFloat(numOnly[1]);
    }
    // Si no, intenta extraer número del inicio (ej: "200mg", "1 tableta")
    const match = str.match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  // Intenta parsear la duración en días (Prioriza número solo como días)
  private parseDuracionEnDias(duracionString: string): number | null {
    if (!duracionString) return null;
    const str = duracionString.toLowerCase().trim();
    // Intenta primero si es solo un número (asume días)
    const numOnly = str.match(/^(\d+)$/);
    if (numOnly) {
      return parseInt(numOnly[1], 10);
    }
    // Si no, busca número y unidad
    const match = str.match(/^(\d+)\s*(dias?|semanas?|meses?)/);
    if (!match) return null;
    
    const cantidad = parseInt(match[1], 10);
    const unidad = match[2];

    if (unidad.startsWith('dia')) return cantidad;
    if (unidad.startsWith('semana')) return cantidad * 7;
    if (unidad.startsWith('mes')) return cantidad * 30; // Estimación
    return null;
  }

  // Intenta parsear tomas por día (Prioriza número solo como "cada X horas")
  private parseTomasPorDia(frecuenciaString: string): number | null {
    if (!frecuenciaString) return null;
    const str = frecuenciaString.toLowerCase().trim();
    
    // Intenta primero si es solo un número (asume "cada X horas")
    const numOnly = str.match(/^(\d+)$/);
    if (numOnly) {
      const horas = parseInt(numOnly[1], 10);
      return horas > 0 ? Math.floor(24 / horas) : null;
    }

    // Si no, busca formatos más complejos
    // Caso "X veces al día"
    let match = str.match(/^(\d+)\s*veces?\s*(al|por)?\s*d[ií]a/);
    if (match) return parseInt(match[1], 10);

    // Caso "Cada X horas"
    match = str.match(/^cada\s+(\d+)\s*horas?/);
    if (match) {
      const horas = parseInt(match[1], 10);
      return horas > 0 ? Math.floor(24 / horas) : null;
    }
    
    // Caso "Una vez al día" / "Diario"
    if (str.includes('una vez al día') || str.includes('diario')) {
        return 1;
    }

    return null; // No se pudo parsear
  }

  // Calcula las estimaciones para un medicamento (versión simplificada)
  calcularEstimadosMedicamento(med: Medicamento): { totalUnidades?: number, totalPaquetes?: number, warnings: string[] } {
    const warnings: string[] = [];
    const resultado: { totalUnidades?: number, totalPaquetes?: number, warnings: string[] } = { warnings };
    
    try {
      // Si no hay datos suficientes para calcular, regresamos warnings
      if (!this.parseDosisNumerica(med.dosis) || !this.parseTomasPorDia(med.frecuencia) || !this.parseDuracionEnDias(med.duracion)) {
        warnings.push('Faltan datos para calcular (dosis, frecuencia o duración)');
        return resultado;
      }
      
      // Contar el total de unidades (ej: 1 pastilla, 3 veces al día, durante 7 días = 21 pastillas)
      const unidadesPorToma = this.parseDosisNumerica(med.dosis) || 0;
      const tomasDia = this.parseTomasPorDia(med.frecuencia) || 0;
      const totalDias = this.parseDuracionEnDias(med.duracion) || 0;
      resultado.totalUnidades = unidadesPorToma * tomasDia * totalDias;
      
      // Asegurarse de que med.unidadesPorPaquete tenga un valor razonable
      let unidadesPorPaquete = med.unidadesPorPaquete;
      
      // NUEVO: Intentar extraer de la presentación si unidadesPorPaquete es undefined
      if (unidadesPorPaquete === undefined && med.presentacion) {
        const match = med.presentacion.toString().match(/\d+/);
        if (match) {
          unidadesPorPaquete = parseInt(match[0], 10);
          console.log(`[Cálculo] Extrayendo unidadesPorPaquete desde presentación: ${unidadesPorPaquete}`);
        }
      }
      
      // NUEVO: Caso especial para Paracetamol y otros medicamentos comunes
      if (unidadesPorPaquete === undefined || unidadesPorPaquete <= 0) {
        if (med.principioActivo && (
            med.principioActivo.includes('Paracetamol') || 
            med.principioActivo.includes('paracetamol') ||
            med.principioActivo.includes('Acetaminophen')
           )) {
          unidadesPorPaquete = 30; // Valor por defecto para Paracetamol
          console.log(`[Cálculo] Forzando unidadesPorPaquete=30 para ${med.principioActivo}`);
        } else if (med.principioActivo && (
            med.principioActivo.includes('Ibuprofeno') || 
            med.principioActivo.includes('ibuprofeno') ||
            med.principioActivo.includes('Ibuprofen')
           )) {
          unidadesPorPaquete = 30; // Valor por defecto para Ibuprofeno
          console.log(`[Cálculo] Forzando unidadesPorPaquete=30 para ${med.principioActivo}`);
        } else if (med.principioActivo && (
            med.principioActivo.includes('Amoxicilina') || 
            med.principioActivo.includes('amoxicilina') ||
            med.principioActivo.includes('Amoxicillin')
           )) {
          unidadesPorPaquete = 21; // Valor por defecto para antibióticos comunes
          console.log(`[Cálculo] Forzando unidadesPorPaquete=21 para ${med.principioActivo}`);
        } else {
          // Para otros medicamentos, asumimos un valor estándar (esto es mejor que undefined)
          unidadesPorPaquete = 10; // Valor genérico
          console.log(`[Cálculo] Usando unidadesPorPaquete=10 por defecto para ${med.principioActivo}`);
          warnings.push('Usando valor estándar de 10 unidades por paquete (no especificado)');
        }
      }
      
      // Calcular número de paquetes (ej: 21 pastillas / 10 pastillas por caja = 2.1 cajas ≈ 3 cajas)
      if (unidadesPorPaquete && unidadesPorPaquete > 0) {
        resultado.totalPaquetes = Math.ceil(resultado.totalUnidades / unidadesPorPaquete);
        // NUEVO: Asignar el valor de unidadesPorPaquete al medicamento si no lo tenía
        if (med.unidadesPorPaquete === undefined || med.unidadesPorPaquete <= 0) {
          med.unidadesPorPaquete = unidadesPorPaquete;
          console.log(`[Cálculo] Actualizando el medicamento con unidadesPorPaquete=${unidadesPorPaquete}`);
        }
      } else {
        warnings.push('No se pudo calcular paquetes (unidadesPorPaquete no disponible)');
        // Asumir que se necesita al menos 1 paquete para no bloquear el cálculo de costos
        resultado.totalPaquetes = 1;
      }
      
      console.log('[Estimado Simplificado]', {
        dosis: med.dosis,
        unidadesPorToma,
        frecuencia: med.frecuencia,
        tomasDia,
        duracion: med.duracion,
        totalDias,
        unidadesPorPaquete,
        totalUnidades: resultado.totalUnidades,
        totalPaquetes: resultado.totalPaquetes,
        warnings
      });
    } catch (error) {
      console.error('Error al calcular estimados:', error);
      warnings.push('Error de cálculo: ' + (error as Error).message);
    }
    
    return resultado;
  }

  // Helper para acceder a advertenciaStock en la plantilla
  getAdvertenciaStock(med: any): string | null {
      return med.advertenciaStock || null;
  }

  // Calcula el costo estimado para una línea de medicamento
  calcularCostoMedicamento(med: Medicamento): number | null {
    // Obtener los estimados (esta llamada también actualiza med.unidadesPorPaquete si es necesario)
    const estimados = this.calcularEstimadosMedicamento(med);
    
    // Si no hay precio definido, no podemos calcular
    if (med.precio === undefined || med.precio === null) {
      console.log('[Cálculo Precio] No hay precio definido');
      return 0; // Retornamos 0 en lugar de null para evitar problemas con cálculos posteriores
    }
    
    // NUEVO: Verificación de unidadesPorPaquete
    // Asegurarse que el medicamento tenga unidadesPorPaquete definido
    if (med.unidadesPorPaquete === undefined || med.unidadesPorPaquete <= 0) {
      // Asignar un valor por defecto basado en el principio activo
      if (med.principioActivo && med.principioActivo.toLowerCase().includes('paracetamol')) {
        med.unidadesPorPaquete = 30;
        console.log(`[Cálculo Precio] Forzando unidadesPorPaquete=30 para Paracetamol`);
      } else {
        // Valor genérico para otros medicamentos
        med.unidadesPorPaquete = 10;
        console.log(`[Cálculo Precio] Usando unidadesPorPaquete=10 por defecto para ${med.principioActivo}`);
      }
    }
    
    // CASO 1: Si tenemos totalPaquetes, usamos precio × totalPaquetes
    if (estimados.totalPaquetes !== undefined && estimados.totalPaquetes > 0) {
      const costo = estimados.totalPaquetes * med.precio;
      console.log(`[Cálculo Precio] CASO 1: ${estimados.totalPaquetes} paquetes × Q${med.precio} = Q${costo}`);
      return costo;
    } 
    // CASO 2: Si no tenemos totalPaquetes pero sí totalUnidades y unidadesPorPaquete
    else if (estimados.totalUnidades !== undefined && med.unidadesPorPaquete && med.unidadesPorPaquete > 0) {
      // Precio unitario = precio paquete / unidades por paquete
      const precioUnitario = med.precio / med.unidadesPorPaquete;
      const costo = estimados.totalUnidades * precioUnitario;
      console.log(`[Cálculo Precio] CASO 2: ${estimados.totalUnidades} unidades × (Q${med.precio}/${med.unidadesPorPaquete}) = Q${costo}`);
      return costo;
    }
    // CASO 3: Si tenemos totalUnidades, pero no unidadesPorPaquete válido,
    // asumimos que el precio es por cada unidad (pastilla/tableta/etc)
    else if (estimados.totalUnidades !== undefined) {
      const costo = estimados.totalUnidades * med.precio;
      console.log(`[Cálculo Precio] CASO 3: ${estimados.totalUnidades} unidades × Q${med.precio} = Q${costo}`);
      return costo;
    }
    // CASO 4: Si no tenemos totalUnidades (no se pudieron calcular estimados)
    // devolvemos al menos el precio del medicamento como una unidad
    else {
      console.log('[Cálculo Precio] CASO 4: Imposible calcular estimados, usando precio base');
      return med.precio;
    }
  }

  // --- Fin Funciones ---
}
