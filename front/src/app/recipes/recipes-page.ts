import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

@Component({
  selector: 'recipes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
                <label class="block text-sm font-medium mb-1">Nombre del Médico</label>
                <input type="text" formControlName="nombreMedico" class="w-full p-2 border rounded bg-gray-100" readonly>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Número de Colegiado</label>
                <input type="text" formControlName="numeroColegiado" class="w-full p-2 border rounded bg-gray-100" readonly>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Especialidad</label>
                <input type="text" formControlName="especialidad" class="w-full p-2 border rounded bg-gray-100" readonly>
              </div>
            </div>
          </div>
          
          <!-- Datos de la receta -->
          <div class="border-b pb-4 mb-4">
            <h2 class="text-xl font-semibold mb-3">Datos de la Receta</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" formControlName="fecha" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Paciente</label>
                <select formControlName="paciente" class="w-full p-2 border rounded">
                  <option value="">Seleccione un paciente</option>
                  <option *ngFor="let paciente of pacientes" [value]="paciente.nombre">
                    {{paciente.nombre}}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">¿Paciente con seguro?</label>
                <div class="flex items-center mt-2">
                  <input type="checkbox" formControlName="tieneSeguro" id="tieneSeguro" class="mr-2">
                  <label for="tieneSeguro">Sí, el paciente tiene seguro</label>
                </div>
              </div>
              <div *ngIf="recetaForm.get('tieneSeguro')?.value">
                <label class="block text-sm font-medium mb-1">Código de Seguro</label>
                <input type="text" formControlName="codigoSeguro" class="w-full p-2 border rounded">
              </div>
            </div>
          </div>
          
          <!-- Datos del medicamento -->
          <div class="border-b pb-4 mb-4" formGroupName="medicamento">
            <h2 class="text-xl font-semibold mb-3">Información del Medicamento</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Principio Activo</label>
                <input type="text" formControlName="principioActivo" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Concentración</label>
                <input type="text" formControlName="concentracion" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Presentación</label>
                <input type="text" formControlName="presentacion" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Forma Farmacéutica</label>
                <input type="text" formControlName="formaFarmaceutica" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Dosis</label>
                <input type="text" formControlName="dosis" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Frecuencia</label>
                <input type="text" formControlName="frecuencia" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Duración</label>
                <input type="text" formControlName="duracion" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Diagnóstico</label>
                <input type="text" formControlName="diagnostico" class="w-full p-2 border rounded">
              </div>
            </div>
          </div>
          
          <!-- Notas especiales -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Notas Especiales</label>
            <textarea formControlName="notasEspeciales" rows="3" class="w-full p-2 border rounded"></textarea>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex justify-end space-x-3">
            <button type="button" class="px-4 py-2 border rounded" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded" [disabled]="recetaForm.invalid">
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
            <button class="px-4 py-2 bg-green-600 text-white rounded mr-2">Descargar PDF</button>
            <button class="px-4 py-2 bg-blue-600 text-white rounded">Enviar por Email</button>
          </div>
        </div>
        
        <div class="border p-4 rounded">
          <div class="border-b pb-2 mb-2">
            <h3 class="text-lg font-bold">Hospital General</h3>
            <p class="text-sm">Código de Receta: {{ recetaPreview.codigo }}</p>
            <p class="text-sm">Fecha: {{ recetaPreview.fecha | date:'dd/MM/yyyy' }}</p>
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
            <p>{{ recetaPreview.medicamento.principioActivo }} {{ recetaPreview.medicamento.concentracion }}</p>
            <p>{{ recetaPreview.medicamento.presentacion }} - {{ recetaPreview.medicamento.formaFarmaceutica }}</p>
            <p class="mt-2"><span class="font-semibold">Dosis:</span> {{ recetaPreview.medicamento.dosis }}</p>
            <p><span class="font-semibold">Frecuencia:</span> {{ recetaPreview.medicamento.frecuencia }}</p>
            <p><span class="font-semibold">Duración:</span> {{ recetaPreview.medicamento.duracion }}</p>
            <p class="mt-2"><span class="font-semibold">Diagnóstico:</span> {{ recetaPreview.medicamento.diagnostico }}</p>
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
  
  // Datos de ejemplo
  codigoHospital = '00256';
  
  pacientes = [
    { id: 1, nombre: 'Juan Pérez', tieneSeguro: true, codigoSeguro: '23423' },
    { id: 2, nombre: 'María García', tieneSeguro: false },
    { id: 3, nombre: 'Carlos López', tieneSeguro: true, codigoSeguro: '45678' }
  ];
  
  constructor(private fb: FormBuilder) {
    // Inicializar formulario
    this.recetaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      paciente: ['', Validators.required],
      nombreMedico: ['Dr. Ejemplo Médico', Validators.required], // Automático
      numeroColegiado: ['MED-12345', Validators.required], // Automático
      especialidad: ['Medicina General', Validators.required], // Automático
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
        diagnostico: ['', Validators.required]
      }),
      notasEspeciales: ['']
    });
    
    // Validar código de seguro cuando se activa
    this.recetaForm.get('tieneSeguro')?.valueChanges.subscribe(tieneSeguro => {
      const codigoSeguroControl = this.recetaForm.get('codigoSeguro');
      if (tieneSeguro) {
        codigoSeguroControl?.setValidators(Validators.required);
      } else {
        codigoSeguroControl?.clearValidators();
      }
      codigoSeguroControl?.updateValueAndValidity();
    });
  }
  
  ngOnInit(): void {
    // Aquí consumiríamos la API para obtener datos del doctor logueado
    console.log('Componente de recetas inicializado - datos del doctor cargados');
  }
  
  generarReceta(): void {
    if (this.recetaForm.valid) {
      const formData = this.recetaForm.value;
      
      // Generar código de receta
      let codigo = '';
      if (formData.tieneSeguro) {
        codigo = `${this.codigoHospital}-${formData.codigoSeguro}-${this.generarIdUnico()}`;
      } else {
        codigo = `${this.codigoHospital}-${this.generarIdUnico()}`;
      }
      
      // Crear objeto de receta para vista previa
      this.recetaPreview = {
        ...formData,
        codigo,
        fecha: new Date(formData.fecha)
      };
      
      this.recetaGenerada = true;
      
      // Aquí iría el código para enviar los datos al backend
      console.log('Receta generada:', this.recetaPreview);
    }
  }
  
  cancelar(): void {
    this.recetaForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      nombreMedico: 'Dr. Ejemplo Médico',
      numeroColegiado: 'MED-12345',
      especialidad: 'Medicina General',
      tieneSeguro: false
    });
    this.recetaGenerada = false;
  }
  
  // Método para generar un ID único (ejemplo simplificado)
  generarIdUnico(): string {
    return '1000' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
}
