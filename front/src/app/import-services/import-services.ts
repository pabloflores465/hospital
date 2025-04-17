import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { back_url } from '../../environments/back_url';

interface Service {
  _id?: string;
  name: string;
  category: string;
  subcategory: string;
  copay: number;
  pay: number;
  total: number;
  deleted?: boolean;
}

interface Ensurance {
  _id?: string;
  name: string;
  coverageDescription: string;
  deleted?: boolean;
}

interface Category {
  _id?: string;
  name: string;
  subcategories?: string[];
}

interface Subcategory {
  _id?: string;
  name: string;
}

@Component({
  selector: 'import-services-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">
        Administrar CRUD de Servicios, Aseguradoras, Categorías y Subcategorías
      </h1>

      <!-- Sección Servicios -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-3">Servicios</h2>
        <ul>
          <li *ngFor="let service of services" class="border-b py-2">
            <p><strong>Nombre:</strong> {{ service.name }}</p>
            <p><strong>Categoría:</strong> {{ service.category }}</p>
            <p><strong>Subcategoría:</strong> {{ service.subcategory }}</p>
            <p><strong>Copago:</strong> {{ service.copay }}</p>
            <p><strong>Pago:</strong> {{ service.pay }}</p>
            <p><strong>Total:</strong> {{ service.total }}</p>
            <p><strong>ID:</strong> {{ service._id }}</p>
            <button
              (click)="onEditService(service)"
              class="text-blue-600 mr-2 mt-2"
            >
              Editar
            </button>
            <button
              (click)="deleteService(service._id!)"
              class="text-red-600 mt-2"
            >
              Eliminar
            </button>
          </li>
        </ul>

        <!-- Formulario de edición de servicio -->
        <div *ngIf="editingService" class="mt-4 border p-4">
          <h3 class="text-lg font-semibold">Editar Servicio</h3>
          <form
            [formGroup]="serviceEditForm"
            (ngSubmit)="onSubmitServiceEdit()"
          >
            <label class="block mb-1 font-medium">Nombre del Servicio</label>
            <input
              formControlName="name"
              class="border p-2 mb-2 block w-full"
            />

            <label class="block mb-1 font-medium">Categoría</label>
            <select
              formControlName="category"
              class="border p-2 mb-2 block w-full"
            >
              <option value="">Seleccione Categoría</option>
              <option *ngFor="let cat of categories" [value]="cat._id">
                {{ cat.name }}
              </option>
            </select>

            <label class="block mb-1 font-medium">Subcategoría</label>
            <select
              formControlName="subcategory"
              class="border p-2 mb-2 block w-full"
            >
              <option value="">Seleccione Subcategoría</option>
              <option *ngFor="let sub of subcategories" [value]="sub._id">
                {{ sub.name }}
              </option>
            </select>

            <label class="block mb-1 font-medium">Copago</label>
            <input
              formControlName="copay"
              type="number"
              class="border p-2 mb-2 block w-full"
            />

            <label class="block mb-1 font-medium">Pago</label>
            <input
              formControlName="pay"
              type="number"
              class="border p-2 mb-2 block w-full"
            />

            <label class="block mb-1 font-medium">Total</label>
            <input
              formControlName="total"
              type="number"
              class="border p-2 mb-2 block w-full"
            />

            <button
              type="submit"
              [disabled]="serviceEditForm.invalid"
              class="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              (click)="cancelEditService()"
              class="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </form>
        </div>

        <h3 class="text-lg font-semibold mt-4">Crear Servicio</h3>
        <form [formGroup]="serviceForm" (ngSubmit)="onSubmitService()">
          <label class="block mb-1 font-medium">Nombre del Servicio</label>
          <input
            formControlName="name"
            placeholder="Nombre del servicio"
            class="border p-2 mb-2 block w-full"
          />

          <label class="block mb-1 font-medium">Categoría</label>
          <select
            formControlName="category"
            class="border p-2 mb-2 block w-full"
          >
            <option value="">Seleccione Categoría</option>
            <option *ngFor="let cat of categories" [value]="cat._id">
              {{ cat.name }}
            </option>
          </select>

          <label class="block mb-1 font-medium">Subcategoría</label>
          <select
            formControlName="subcategory"
            class="border p-2 mb-2 block w-full"
          >
            <option value="">Seleccione Subcategoría</option>
            <option *ngFor="let sub of subcategories" [value]="sub._id">
              {{ sub.name }}
            </option>
          </select>

          <label class="block mb-1 font-medium">Copago</label>
          <input
            formControlName="copay"
            type="number"
            placeholder="Copago"
            class="border p-2 mb-2 block w-full"
          />

          <label class="block mb-1 font-medium">Pago</label>
          <input
            formControlName="pay"
            type="number"
            placeholder="Pago"
            class="border p-2 mb-2 block w-full"
          />

          <label class="block mb-1 font-medium">Total</label>
          <input
            formControlName="total"
            type="number"
            placeholder="Total"
            class="border p-2 mb-2 block w-full"
          />

          <button
            type="submit"
            [disabled]="serviceForm.invalid"
            class="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Servicio
          </button>
        </form>
      </div>

      <!-- Sección Aseguradoras -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-3">Aseguradoras</h2>
        <ul>
          <li *ngFor="let ensurance of ensurances" class="border-b py-2">
            <p><strong>Nombre:</strong> {{ ensurance.name }}</p>
            <p>
              <strong>Descripción de Cobertura:</strong>
              {{ ensurance.coverageDescription }}
            </p>
            <p><strong>ID:</strong> {{ ensurance._id }}</p>
            <button
              (click)="onEditEnsurance(ensurance)"
              class="text-blue-600 mr-2 mt-2"
            >
              Editar
            </button>
            <button
              (click)="deleteEnsurance(ensurance._id!)"
              class="text-red-600 mt-2"
            >
              Eliminar
            </button>
          </li>
        </ul>

        <!-- Formulario de edición de aseguradora -->
        <div *ngIf="editingEnsurance" class="mt-4 border p-4">
          <h3 class="text-lg font-semibold">Editar Aseguradora</h3>
          <form
            [formGroup]="ensuranceEditForm"
            (ngSubmit)="onSubmitEnsuranceEdit()"
          >
            <label class="block mb-1 font-medium"
              >Nombre de la Aseguradora</label
            >
            <input
              formControlName="name"
              class="border p-2 mb-2 block w-full"
            />

            <label class="block mb-1 font-medium"
              >Descripción de Cobertura</label
            >
            <input
              formControlName="coverageDescription"
              class="border p-2 mb-2 block w-full"
            />

            <button
              type="submit"
              [disabled]="ensuranceEditForm.invalid"
              class="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              (click)="cancelEditEnsurance()"
              class="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </form>
        </div>

        <h3 class="text-lg font-semibold mt-4">Crear Aseguradora</h3>
        <form [formGroup]="ensuranceForm" (ngSubmit)="onSubmitEnsurance()">
          <label class="block mb-1 font-medium">Nombre de la Aseguradora</label>
          <input
            formControlName="name"
            placeholder="Nombre de la aseguradora"
            class="border p-2 mb-2 block w-full"
          />

          <label class="block mb-1 font-medium">Descripción de Cobertura</label>
          <input
            formControlName="coverageDescription"
            placeholder="Descripción de cobertura"
            class="border p-2 mb-2 block w-full"
          />

          <button
            type="submit"
            [disabled]="ensuranceForm.invalid"
            class="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Aseguradora
          </button>
        </form>
      </div>

      <!-- Sección Categorías -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-3">Categorías</h2>
        <ul>
          <li *ngFor="let cat of categories" class="border-b py-2">
            <p><strong>Nombre:</strong> {{ cat.name }}</p>
            <button
              (click)="onEditCategory(cat)"
              class="text-blue-600 mr-2 mt-2"
            >
              Editar
            </button>
            <button
              (click)="deleteCategory(cat._id!)"
              class="text-red-600 mt-2"
            >
              Eliminar
            </button>
          </li>
        </ul>

        <!-- Formulario de edición de categoría -->
        <div *ngIf="editingCategory" class="mt-4 border p-4">
          <h3 class="text-lg font-semibold">Editar Categoría</h3>
          <form
            [formGroup]="categoryEditForm"
            (ngSubmit)="onSubmitCategoryEdit()"
          >
            <label class="block mb-1 font-medium">Nombre de la Categoría</label>
            <input
              formControlName="name"
              class="border p-2 mb-2 block w-full"
            />

            <button
              type="submit"
              [disabled]="categoryEditForm.invalid"
              class="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              (click)="cancelEditCategory()"
              class="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </form>
        </div>

        <h3 class="text-lg font-semibold mt-4">Crear Categoría</h3>
        <form [formGroup]="categoryForm" (ngSubmit)="onSubmitCategory()">
          <label class="block mb-1 font-medium">Nombre de la Categoría</label>
          <input
            formControlName="name"
            placeholder="Nombre de la categoría"
            class="border p-2 mb-2 block w-full"
          />
          <button
            type="submit"
            [disabled]="categoryForm.invalid"
            class="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Categoría
          </button>
        </form>
      </div>

      <!-- Sección Subcategorías -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-3">Subcategorías</h2>
        <ul>
          <li *ngFor="let sub of subcategories" class="border-b py-2">
            <p><strong>Nombre:</strong> {{ sub.name }}</p>
            <button
              (click)="onEditSubcategory(sub)"
              class="text-blue-600 mr-2 mt-2"
            >
              Editar
            </button>
            <button
              (click)="deleteSubcategory(sub._id!)"
              class="text-red-600 mt-2"
            >
              Eliminar
            </button>
          </li>
        </ul>

        <!-- Formulario de edición de subcategoría -->
        <div *ngIf="editingSubcategory" class="mt-4 border p-4">
          <h3 class="text-lg font-semibold">Editar Subcategoría</h3>
          <form
            [formGroup]="subcategoryEditForm"
            (ngSubmit)="onSubmitSubcategoryEdit()"
          >
            <label class="block mb-1 font-medium"
              >Nombre de la Subcategoría</label
            >
            <input
              formControlName="name"
              class="border p-2 mb-2 block w-full"
            />

            <button
              type="submit"
              [disabled]="subcategoryEditForm.invalid"
              class="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              (click)="cancelEditSubcategory()"
              class="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </form>
        </div>

        <h3 class="text-lg font-semibold mt-4">Crear Subcategoría</h3>
        <form [formGroup]="subcategoryForm" (ngSubmit)="onSubmitSubcategory()">
          <label class="block mb-1 font-medium"
            >Nombre de la Subcategoría</label
          >
          <input
            formControlName="name"
            placeholder="Nombre de la subcategoría"
            class="border p-2 mb-2 block w-full"
          />
          <button
            type="submit"
            [disabled]="subcategoryForm.invalid"
            class="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Subcategoría
          </button>
        </form>
      </div>

      <!-- Sección Importar Catálogo -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-3">
          Importar Catálogo de Aseguradora
        </h2>
        
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 class="font-medium text-blue-800 mb-2">Guía para importar servicios</h3>
          <ol class="list-decimal ml-5 text-sm text-blue-800">
            <li class="mb-1">Selecciona un archivo JSON con la estructura correcta</li>
            <li class="mb-1">Cada servicio debe tener service_id, ensurance_id, description y cost</li>
            <li class="mb-1">Opcionalmente, puedes incluir campos como name, category, subcategory, copay, pay y total para crear un servicio completo</li>
            <li class="mb-1">Los IDs pueden ser nuevos o existentes en la base de datos</li>
            <li class="mb-1">Ideal para importar datos desde otros sistemas o restaurar datos borrados</li>
          </ol>
        </div>
        
        <input
          type="file"
          (change)="onFileSelected($event)"
          accept=".json"
          class="block mb-2 border p-2 rounded w-full"
        />
        <button
          (click)="importCatalog()"
          [disabled]="!fileData" 
          class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Importar
        </button>
        
        <!-- Mostrar resultados -->
        <div *ngIf="result && (result.created > 0 || result.updated > 0 || (result.services_created && result.services_created > 0))" class="mt-4 bg-green-100 p-4 rounded">
          <p><strong>Servicios creados:</strong> {{ result.services_created ?? 0 }}</p>
          <p><strong>Relaciones creadas:</strong> {{ result.created }}</p>
          <p><strong>Relaciones actualizadas:</strong> {{ result.updated }}</p>
        </div>
        
        <!-- Mostrar errores detallados -->
        <div *ngIf="result && result.errors && result.errors > 0" class="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h4 class="font-medium text-yellow-800 mb-2">Se encontraron {{ result.errors }} errores:</h4>
          <ul class="list-disc ml-5 text-sm">
            <li *ngFor="let error of result.error_details" class="text-yellow-800 mb-1">
              {{ error }}
            </li>
          </ul>
        </div>
        
        <!-- Mostrar error de importación de catálogo -->
        <div *ngIf="importCatalogError" class="mt-3 text-red-600">
          {{ importCatalogError }}
        </div>
        
        <!-- Ejemplos de formato -->
        <div class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h4 class="font-medium mb-2">Ejemplo de formato JSON correcto:</h4>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">{{ exampleJson }}</pre>
        </div>
      </div>

      <!-- Sección Exportar/Importar Datos de Usuario -->
      <div class="bg-white rounded-lg shadow p-6 mt-6">
        <h2 class="text-xl font-semibold mb-5">
          Exportar/Importar Datos de Usuario
        </h2>
        
        <!-- Exportar datos de usuario -->
        <div class="mb-6 border-b pb-6">
          <h3 class="text-lg font-medium mb-3">Exportar Datos</h3>
          <p class="mb-4">Exporta todos los datos de un usuario (diagnósticos, exámenes, recetas, etc.) en formato JSON.</p>
          
          <div class="mb-4">
            <div class="mb-3">
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  name="searchType" 
                  value="id" 
                  [(ngModel)]="exportSearchType" 
                  class="form-radio h-4 w-4"
                >
                <span class="ml-2">Buscar por ID</span>
              </label>
              <label class="inline-flex items-center ml-4">
                <input 
                  type="radio" 
                  name="searchType" 
                  value="email" 
                  [(ngModel)]="exportSearchType" 
                  class="form-radio h-4 w-4"
                >
                <span class="ml-2">Buscar por Correo</span>
              </label>
              <label class="inline-flex items-center ml-4">
                <input 
                  type="radio" 
                  name="searchType" 
                  value="all" 
                  [(ngModel)]="exportSearchType" 
                  class="form-radio h-4 w-4"
                >
                <span class="ml-2">Exportar Todos</span>
              </label>
            </div>
            
            <div class="flex items-end gap-4" *ngIf="exportSearchType === 'id'">
              <div class="flex-1">
                <label class="block mb-1 font-medium">ID de Usuario</label>
                <input
                  [(ngModel)]="exportUserId"
                  placeholder="ID del usuario a exportar"
                  class="border p-2 rounded w-full"
                />
              </div>
              <button
                (click)="exportUserData()"
                [disabled]="!exportUserId"
                class="bg-blue-600 text-white px-4 py-2 rounded h-[42px]"
              >
                Exportar Datos
              </button>
            </div>
            
            <div class="flex items-end gap-4" *ngIf="exportSearchType === 'email'">
              <div class="flex-1">
                <label class="block mb-1 font-medium">Correo electrónico</label>
                <input
                  [(ngModel)]="exportUserEmail"
                  placeholder="Correo del usuario a exportar"
                  class="border p-2 rounded w-full"
                />
              </div>
              <button
                (click)="exportUserData()"
                [disabled]="!exportUserEmail"
                class="bg-blue-600 text-white px-4 py-2 rounded h-[42px]"
              >
                Exportar Datos
              </button>
            </div>
            
            <div *ngIf="exportSearchType === 'all'" class="mt-3">
              <p class="mb-3 text-sm text-gray-600">Esta opción exportará los datos de todos los usuarios del sistema.</p>
              <button
                (click)="exportUserData()"
                class="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Exportar Todos los Datos
              </button>
            </div>
          </div>
          
          <div *ngIf="exportError" class="mt-3 text-red-600">
            {{ exportError }}
          </div>
        </div>
        
        <!-- Importar datos de usuario -->
        <div>
          <h3 class="text-lg font-medium mb-3">Importar Datos</h3>
          <p class="mb-4">Importa datos de usuario previamente exportados en formato JSON.</p>
          
          <input
            type="file"
            (change)="onUserDataFileSelected($event)"
            accept=".json"
            class="block mb-4 border p-2 rounded w-full"
          />
          <button
            (click)="importUserData()"
            [disabled]="!userDataFile"
            class="bg-green-600 text-white px-4 py-2 rounded"
          >
            Importar Datos
          </button>
          
          <div *ngIf="importResult" class="mt-4 bg-green-100 p-4 rounded">
            <h4 class="font-semibold mb-2">Resultados de la importación:</h4>
            <p><strong>Usuario:</strong> {{ importResult.stats.user }}</p>
            <p><strong>Recetas creadas:</strong> {{ importResult.stats.recipes_created }}</p>
            <p><strong>Recetas actualizadas:</strong> {{ importResult.stats.recipes_updated }}</p>
            <p><strong>Citas creadas:</strong> {{ importResult.stats.appointments_created }}</p>
            <p><strong>Citas actualizadas:</strong> {{ importResult.stats.appointments_updated }}</p>
            <p><strong>Registros médicos creados:</strong> {{ importResult.stats.medical_records_created }}</p>
            <p><strong>Registros médicos actualizados:</strong> {{ importResult.stats.medical_records_updated }}</p>
          </div>
          
          <div *ngIf="importError" class="mt-3 text-red-600">
            {{ importError }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ImportServicesPage implements OnInit {
  services: Service[] = [];
  ensurances: Ensurance[] = [];
  categories: Category[] = [];
  subcategories: Subcategory[] = [];
  fileData: any;
  result: { 
    created: number; 
    updated: number; 
    errors?: number;
    error_details?: string[];
    services_created?: number;
  } | null = null;
  
  // Guía de importación
  importGuide: string = `
    <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 class="font-medium text-blue-800 mb-2">Guía para importar servicios</h3>
      <ol class="list-decimal ml-5 text-sm text-blue-800">
        <li class="mb-1">Selecciona un archivo JSON con la estructura correcta</li>
        <li class="mb-1">Cada servicio debe tener service_id, ensurance_id, description y cost</li>
        <li class="mb-1">Opcionalmente, puedes incluir campos como name, category, subcategory, copay, pay y total para crear un servicio completo</li>
        <li class="mb-1">Los IDs pueden ser nuevos o existentes en la base de datos</li>
        <li class="mb-1">Ideal para importar datos desde otros sistemas o restaurar datos borrados</li>
      </ol>
    </div>
  `;
  
  // Ejemplo JSON
  exampleJson: string = `{
  "services": [
    {
      "service_id": "ID_DEL_SERVICIO",
      "ensurance_id": "ID_DE_LA_ASEGURADORA",
      "name": "Nombre del servicio",
      "category": "ID_DE_CATEGORÍA",
      "subcategory": "ID_DE_SUBCATEGORÍA",
      "copay": 10.50,
      "pay": 15.00,
      "total": 25.50,
      "description": "Descripción del servicio con esta aseguradora",
      "cost": 25.50
    }
  ]
}`;
  
  // Formularios para crear
  serviceForm: FormGroup;
  ensuranceForm: FormGroup;
  categoryForm: FormGroup;
  subcategoryForm: FormGroup;

  // Formularios y variables para editar
  editingService: Service | null = null;
  serviceEditForm: FormGroup;

  editingEnsurance: Ensurance | null = null;
  ensuranceEditForm: FormGroup;

  editingCategory: Category | null = null;
  categoryEditForm: FormGroup;

  editingSubcategory: Subcategory | null = null;
  subcategoryEditForm: FormGroup;

  // Variables para exportar/importar datos de usuario
  exportUserId: string = '';
  exportUserEmail: string = '';
  exportSearchType: string = 'id';
  exportError: string = '';
  userDataFile: File | null = null;
  importResult: any = null;
  importError: string = '';
  
  // Error para importación de catálogo
  importCatalogError: string = '';

  constructor(private http: HttpClient) {
    // Formulario para crear servicio
    this.serviceForm = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required),
      subcategory: new FormControl('', Validators.required),
      copay: new FormControl(0, [Validators.required, Validators.min(0)]),
      pay: new FormControl(0, [Validators.required, Validators.min(0)]),
      total: new FormControl(0, [Validators.required, Validators.min(0)]),
    });
    // Formulario para editar servicio
    this.serviceEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required),
      subcategory: new FormControl('', Validators.required),
      copay: new FormControl(0, [Validators.required, Validators.min(0)]),
      pay: new FormControl(0, [Validators.required, Validators.min(0)]),
      total: new FormControl(0, [Validators.required, Validators.min(0)]),
    });
    // Formulario para crear aseguradora
    this.ensuranceForm = new FormGroup({
      name: new FormControl('', Validators.required),
      coverageDescription: new FormControl('', Validators.required),
    });
    // Formulario para editar aseguradora
    this.ensuranceEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
      coverageDescription: new FormControl('', Validators.required),
    });
    // Formulario para crear categoría
    this.categoryForm = new FormGroup({
      name: new FormControl('', Validators.required),
    });
    // Formulario para editar categoría
    this.categoryEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
    });
    // Formulario para crear subcategoría
    this.subcategoryForm = new FormGroup({
      name: new FormControl('', Validators.required),
    });
    // Formulario para editar subcategoría
    this.subcategoryEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.getServices();
    this.getEnsurances();
    this.getCategories();
    this.getSubcategories();
  }

  // Servicios
  async getServices(): Promise<void> {
    const url = await back_url();
    this.http.get<{ services: Service[] }>(`${url}/api/services/`).subscribe({
      next: (res) => (this.services = res.services),
      error: (err) => console.error('Error cargando servicios', err),
    });
  }
  async onSubmitService(): Promise<void> {
    const url = await back_url();
    if (this.serviceForm.invalid) return;
    const newService: Service = this.serviceForm.value;
    this.http.post(`${url}/api/services/create/`, newService).subscribe({
      next: () => {
        this.getServices();
        this.serviceForm.reset();
      },
      error: (err) => console.error('Error creando servicio', err),
    });
  }
  async deleteService(serviceId: string): Promise<void> {
    const url = await back_url();
    this.http.delete(`${url}/api/services/${serviceId}/delete/`).subscribe({
      next: () => this.getServices(),
      error: (err) => console.error('Error eliminando servicio', err),
    });
  }
  onEditService(service: Service): void {
    this.editingService = service;
    this.serviceEditForm.patchValue({
      name: service.name,
      category: service.category,
      subcategory: service.subcategory,
      copay: service.copay,
      pay: service.pay,
      total: service.total,
    });
  }
  async onSubmitServiceEdit(): Promise<void> {
    const url = await back_url();
    if (!this.editingService || this.serviceEditForm.invalid) return;
    const updatedService: Service = this.serviceEditForm.value;
    this.http
      .put(
        `${url}/api/services/${this.editingService._id}/update/`,
        updatedService
      )
      .subscribe({
        next: () => {
          this.getServices();
          this.editingService = null;
        },
        error: (err) => console.error('Error actualizando servicio', err),
      });
  }
  cancelEditService(): void {
    this.editingService = null;
  }

  // Aseguradoras
  async getEnsurances(): Promise<void> {
    const url = await back_url();
    this.http
      .get<{ ensurances: Ensurance[] }>(`${url}/api/ensurances/`)
      .subscribe({
        next: (res) => (this.ensurances = res.ensurances),
        error: (err) => console.error('Error cargando aseguradoras', err),
      });
  }
  async onSubmitEnsurance(): Promise<void> {
    if (this.ensuranceForm.invalid) return;
    const newEnsurance: Ensurance = this.ensuranceForm.value;
    const url = await back_url();
    this.http.post(`${url}/api/ensurances/create/`, newEnsurance).subscribe({
      next: () => {
        this.getEnsurances();
        this.ensuranceForm.reset();
      },
      error: (err) => console.error('Error creando aseguradora', err),
    });
  }
  async deleteEnsurance(ensuranceId: string): Promise<void> {
    const url = await back_url();
    this.http.delete(`${url}/api/ensurances/${ensuranceId}/delete/`).subscribe({
      next: () => this.getEnsurances(),
      error: (err) => console.error('Error eliminando aseguradora', err),
    });
  }
  onEditEnsurance(ensurance: Ensurance): void {
    this.editingEnsurance = ensurance;
    this.ensuranceEditForm.patchValue({
      name: ensurance.name,
      coverageDescription: ensurance.coverageDescription,
    });
  }
  async onSubmitEnsuranceEdit(): Promise<void> {
    const url = await back_url();
    if (!this.editingEnsurance || this.ensuranceEditForm.invalid) return;
    const updatedEnsurance: Ensurance = this.ensuranceEditForm.value;
    this.http
      .put(
        `${url}/api/ensurances/${this.editingEnsurance._id}/update/`,
        updatedEnsurance
      )
      .subscribe({
        next: () => {
          this.getEnsurances();
          this.editingEnsurance = null;
        },
        error: (err) => console.error('Error actualizando aseguradora', err),
      });
  }
  cancelEditEnsurance(): void {
    this.editingEnsurance = null;
  }

  // Categorías
  async getCategories(): Promise<void> {
    const url = await back_url();
    this.http
      .get<{ categories: Category[] }>(`${url}/api/categories/`)
      .subscribe({
        next: (res) => (this.categories = res.categories),
        error: (err) => console.error('Error cargando categorías', err),
      });
  }
  async onSubmitCategory(): Promise<void> {
    const url = await back_url();
    if (this.categoryForm.invalid) return;
    const newCategory: Category = this.categoryForm.value;
    this.http.post(`${url}/api/categories/create/`, newCategory).subscribe({
      next: () => {
        this.getCategories();
        this.categoryForm.reset();
      },
      error: (err) => console.error('Error creando categoría', err),
    });
  }
  async deleteCategory(categoryId: string): Promise<void> {
    const url = await back_url();
    this.http.delete(`${url}/api/categories/${categoryId}/delete/`).subscribe({
      next: () => this.getCategories(),
      error: (err) => console.error('Error eliminando categoría', err),
    });
  }
  onEditCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryEditForm.patchValue({ name: category.name });
  }
  async onSubmitCategoryEdit(): Promise<void> {
    const url = await back_url();
    if (!this.editingCategory || this.categoryEditForm.invalid) return;
    const updatedCategory: Category = this.categoryEditForm.value;
    this.http
      .put(
        `${url}/api/categories/${this.editingCategory._id}/update/`,
        updatedCategory
      )
      .subscribe({
        next: () => {
          this.getCategories();
          this.editingCategory = null;
        },
        error: (err) => console.error('Error actualizando categoría', err),
      });
  }
  cancelEditCategory(): void {
    this.editingCategory = null;
  }

  // Subcategorías
  async getSubcategories(): Promise<void> {
    const url = await back_url();
    this.http
      .get<{ subcategories: Subcategory[] }>(`${url}/api/subcategories/`)
      .subscribe({
        next: (res) => (this.subcategories = res.subcategories),
        error: (err) => console.error('Error cargando subcategorías', err),
      });
  }
  async onSubmitSubcategory(): Promise<void> {
    const url = await back_url();
    if (this.subcategoryForm.invalid) return;
    const newSubcategory: Subcategory = this.subcategoryForm.value;
    this.http
      .post(`${url}/api/subcategories/create/`, newSubcategory)
      .subscribe({
        next: () => {
          this.getSubcategories();
          this.subcategoryForm.reset();
        },
        error: (err) => console.error('Error creando subcategoría', err),
      });
  }
  async deleteSubcategory(subcategoryId: string): Promise<void> {
    const url = await back_url();
    this.http
      .delete(`${url}/api/subcategories/${subcategoryId}/delete/`)
      .subscribe({
        next: () => this.getSubcategories(),
        error: (err) => console.error('Error eliminando subcategoría', err),
      });
  }
  onEditSubcategory(subcategory: Subcategory): void {
    this.editingSubcategory = subcategory;
    this.subcategoryEditForm.patchValue({ name: subcategory.name });
  }
  async onSubmitSubcategoryEdit(): Promise<void> {
    const url = await back_url();
    if (!this.editingSubcategory || this.subcategoryEditForm.invalid) return;
    const updatedSubcategory: Subcategory = this.subcategoryEditForm.value;
    this.http
      .put(
        `${url}/api/subcategories/${this.editingSubcategory._id}/update/`,
        updatedSubcategory
      )
      .subscribe({
        next: () => {
          this.getSubcategories();
          this.editingSubcategory = null;
        },
        error: (err) => console.error('Error actualizando subcategoría', err),
      });
  }
  cancelEditSubcategory(): void {
    this.editingSubcategory = null;
  }

  // Importar catálogo
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      const reader = new FileReader();
      
      // Resetear errores y resultados anteriores
      this.fileData = null;
      this.result = null;
      this.importCatalogError = ''; 

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          this.fileData = JSON.parse(e.target?.result as string);
          console.log('File data parsed:', this.fileData);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          this.importCatalogError = 'Error al leer el archivo JSON. Asegúrate de que el formato sea correcto.';
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        this.importCatalogError = 'Error al leer el archivo.';
      };

      reader.readAsText(file);
    }
  }

  async importCatalog(): Promise<void> {
    if (!this.fileData) {
      this.importCatalogError = 'No se ha seleccionado ningún archivo o el archivo está vacío.';
      return;
    }
    
    this.importCatalogError = ''; // Limpiar error previo
    this.result = null; // Limpiar resultado previo

    try {
      const url = await back_url();
      this.http
        .post<any>(
          `${url}/api/services_ensurance/import/`,
          this.fileData
        )
        .subscribe({
          next: (res) => {
            this.result = res;
            console.log('Import result:', res);
            
            // Solo limpiar los datos si no hay errores o si hay algunos éxitos
            if (!res.errors || res.created > 0 || res.updated > 0) {
              this.fileData = null; // Limpiar datos del archivo después de importar
              
              // Resetear el campo de archivo si es posible
              const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
              if (fileInput) {
                fileInput.value = ''; 
              }
            }
          },
          error: (err) => {
            console.error('Error importing catalog:', err);
            this.result = null;
            this.importCatalogError = err.error?.error || 'Error al importar el catálogo. Verifica los IDs y el formato del archivo.';
          },
        });
    } catch (error) {
      console.error('Error during import setup:', error);
      this.importCatalogError = 'Error inesperado durante la configuración de la importación.';
    }
  }

  onUserDataFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.userDataFile = element.files[0];
      this.importError = '';
      this.importResult = null;
    }
  }

  async exportUserData(): Promise<void> {
    try {
      const url = await back_url();
      let exportUrl = `${url}/api/users/export?`;
      
      if (this.exportSearchType === 'id') {
        if (!this.exportUserId) {
          this.exportError = 'Por favor, ingrese un ID de usuario válido';
          return;
        }
        exportUrl += `user_id=${this.exportUserId}`;
      } 
      else if (this.exportSearchType === 'email') {
        if (!this.exportUserEmail) {
          this.exportError = 'Por favor, ingrese un correo electrónico válido';
          return;
        }
        exportUrl += `email=${this.exportUserEmail}`;
      }
      else if (this.exportSearchType === 'all') {
        exportUrl += 'export_all=true';
      }
      
      // Usamos window.open para descargar directamente el archivo
      window.open(exportUrl, '_blank');
      this.exportError = '';
    } catch (error) {
      console.error('Error al exportar datos de usuario:', error);
      this.exportError = 'Error al exportar datos. Por favor, intente nuevamente.';
    }
  }

  async importUserData(): Promise<void> {
    if (!this.userDataFile) {
      this.importError = 'Por favor, seleccione un archivo JSON';
      return;
    }

    try {
      const url = await back_url();
      const formData = new FormData();
      formData.append('file', this.userDataFile);

      this.http.post(`${url}/api/users/import`, formData).subscribe({
        next: (response: any) => {
          this.importResult = response;
          this.importError = '';
          this.userDataFile = null;
          // Resetear el campo de archivo
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        },
        error: (err) => {
          console.error('Error importando datos de usuario:', err);
          this.importError = err.error?.error || 'Error al importar datos. Por favor, verifique el formato del archivo.';
        }
      });
    } catch (error) {
      console.error('Error al importar datos de usuario:', error);
      this.importError = 'Error al importar datos. Por favor, intente nuevamente.';
    }
  }
}
