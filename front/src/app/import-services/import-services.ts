import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

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
  imports: [CommonModule, ReactiveFormsModule],
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
          <button (click)="onEditService(service)" class="text-blue-600 mr-2 mt-2">Editar</button>
          <button (click)="deleteService(service._id!)" class="text-red-600 mt-2">Eliminar</button>
        </li>
      </ul>
      
      <!-- Formulario de edición de servicio -->
      <div *ngIf="editingService" class="mt-4 border p-4">
        <h3 class="text-lg font-semibold">Editar Servicio</h3>
        <form [formGroup]="serviceEditForm" (ngSubmit)="onSubmitServiceEdit()">
          <label class="block mb-1 font-medium">Nombre del Servicio</label>
          <input formControlName="name" class="border p-2 mb-2 block w-full">
          
          <label class="block mb-1 font-medium">Categoría</label>
          <select formControlName="category" class="border p-2 mb-2 block w-full">
            <option value="">Seleccione Categoría</option>
            <option *ngFor="let cat of categories" [value]="cat._id">{{ cat.name }}</option>
          </select>
          
          <label class="block mb-1 font-medium">Subcategoría</label>
          <select formControlName="subcategory" class="border p-2 mb-2 block w-full">
            <option value="">Seleccione Subcategoría</option>
            <option *ngFor="let sub of subcategories" [value]="sub._id">{{ sub.name }}</option>
          </select>
          
          <label class="block mb-1 font-medium">Copago</label>
          <input formControlName="copay" type="number" class="border p-2 mb-2 block w-full">
          
          <label class="block mb-1 font-medium">Pago</label>
          <input formControlName="pay" type="number" class="border p-2 mb-2 block w-full">
          
          <label class="block mb-1 font-medium">Total</label>
          <input formControlName="total" type="number" class="border p-2 mb-2 block w-full">
          
          <button type="submit" [disabled]="serviceEditForm.invalid" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Guardar Cambios
          </button>
          <button type="button" (click)="cancelEditService()" class="bg-gray-600 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        </form>
      </div>
      
      <h3 class="text-lg font-semibold mt-4">Crear Servicio</h3>
      <form [formGroup]="serviceForm" (ngSubmit)="onSubmitService()">
        <label class="block mb-1 font-medium">Nombre del Servicio</label>
        <input formControlName="name" placeholder="Nombre del servicio" class="border p-2 mb-2 block w-full">
        
        <label class="block mb-1 font-medium">Categoría</label>
        <select formControlName="category" class="border p-2 mb-2 block w-full">
          <option value="">Seleccione Categoría</option>
          <option *ngFor="let cat of categories" [value]="cat._id">{{ cat.name }}</option>
        </select>
        
        <label class="block mb-1 font-medium">Subcategoría</label>
        <select formControlName="subcategory" class="border p-2 mb-2 block w-full">
          <option value="">Seleccione Subcategoría</option>
          <option *ngFor="let sub of subcategories" [value]="sub._id">{{ sub.name }}</option>
        </select>
        
        <label class="block mb-1 font-medium">Copago</label>
        <input formControlName="copay" type="number" placeholder="Copago" class="border p-2 mb-2 block w-full">
        
        <label class="block mb-1 font-medium">Pago</label>
        <input formControlName="pay" type="number" placeholder="Pago" class="border p-2 mb-2 block w-full">
        
        <label class="block mb-1 font-medium">Total</label>
        <input formControlName="total" type="number" placeholder="Total" class="border p-2 mb-2 block w-full">
        
        <button type="submit" [disabled]="serviceForm.invalid" class="bg-green-600 text-white px-4 py-2 rounded">
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
          <p><strong>Descripción de Cobertura:</strong> {{ ensurance.coverageDescription }}</p>
          <button (click)="onEditEnsurance(ensurance)" class="text-blue-600 mr-2 mt-2">Editar</button>
          <button (click)="deleteEnsurance(ensurance._id!)" class="text-red-600 mt-2">Eliminar</button>
        </li>
      </ul>
      
      <!-- Formulario de edición de aseguradora -->
      <div *ngIf="editingEnsurance" class="mt-4 border p-4">
        <h3 class="text-lg font-semibold">Editar Aseguradora</h3>
        <form [formGroup]="ensuranceEditForm" (ngSubmit)="onSubmitEnsuranceEdit()">
          <label class="block mb-1 font-medium">Nombre de la Aseguradora</label>
          <input formControlName="name" class="border p-2 mb-2 block w-full">
          
          <label class="block mb-1 font-medium">Descripción de Cobertura</label>
          <input formControlName="coverageDescription" class="border p-2 mb-2 block w-full">
          
          <button type="submit" [disabled]="ensuranceEditForm.invalid" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Guardar Cambios
          </button>
          <button type="button" (click)="cancelEditEnsurance()" class="bg-gray-600 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        </form>
      </div>
      
      <h3 class="text-lg font-semibold mt-4">Crear Aseguradora</h3>
      <form [formGroup]="ensuranceForm" (ngSubmit)="onSubmitEnsurance()">
        <label class="block mb-1 font-medium">Nombre de la Aseguradora</label>
        <input formControlName="name" placeholder="Nombre de la aseguradora" class="border p-2 mb-2 block w-full">
        
        <label class="block mb-1 font-medium">Descripción de Cobertura</label>
        <input formControlName="coverageDescription" placeholder="Descripción de cobertura" class="border p-2 mb-2 block w-full">
        
        <button type="submit" [disabled]="ensuranceForm.invalid" class="bg-green-600 text-white px-4 py-2 rounded">
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
          <button (click)="onEditCategory(cat)" class="text-blue-600 mr-2 mt-2">Editar</button>
          <button (click)="deleteCategory(cat._id!)" class="text-red-600 mt-2">Eliminar</button>
        </li>
      </ul>
      
      <!-- Formulario de edición de categoría -->
      <div *ngIf="editingCategory" class="mt-4 border p-4">
        <h3 class="text-lg font-semibold">Editar Categoría</h3>
        <form [formGroup]="categoryEditForm" (ngSubmit)="onSubmitCategoryEdit()">
          <label class="block mb-1 font-medium">Nombre de la Categoría</label>
          <input formControlName="name" class="border p-2 mb-2 block w-full">
          
          <button type="submit" [disabled]="categoryEditForm.invalid" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Guardar Cambios
          </button>
          <button type="button" (click)="cancelEditCategory()" class="bg-gray-600 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        </form>
      </div>
      
      <h3 class="text-lg font-semibold mt-4">Crear Categoría</h3>
      <form [formGroup]="categoryForm" (ngSubmit)="onSubmitCategory()">
        <label class="block mb-1 font-medium">Nombre de la Categoría</label>
        <input formControlName="name" placeholder="Nombre de la categoría" class="border p-2 mb-2 block w-full">
        <button type="submit" [disabled]="categoryForm.invalid" class="bg-green-600 text-white px-4 py-2 rounded">
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
          <button (click)="onEditSubcategory(sub)" class="text-blue-600 mr-2 mt-2">Editar</button>
          <button (click)="deleteSubcategory(sub._id!)" class="text-red-600 mt-2">Eliminar</button>
        </li>
      </ul>
      
      <!-- Formulario de edición de subcategoría -->
      <div *ngIf="editingSubcategory" class="mt-4 border p-4">
        <h3 class="text-lg font-semibold">Editar Subcategoría</h3>
        <form [formGroup]="subcategoryEditForm" (ngSubmit)="onSubmitSubcategoryEdit()">
          <label class="block mb-1 font-medium">Nombre de la Subcategoría</label>
          <input formControlName="name" class="border p-2 mb-2 block w-full">
          
          <button type="submit" [disabled]="subcategoryEditForm.invalid" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Guardar Cambios
          </button>
          <button type="button" (click)="cancelEditSubcategory()" class="bg-gray-600 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        </form>
      </div>
      
      <h3 class="text-lg font-semibold mt-4">Crear Subcategoría</h3>
      <form [formGroup]="subcategoryForm" (ngSubmit)="onSubmitSubcategory()">
        <label class="block mb-1 font-medium">Nombre de la Subcategoría</label>
        <input formControlName="name" placeholder="Nombre de la subcategoría" class="border p-2 mb-2 block w-full">
        <button type="submit" [disabled]="subcategoryForm.invalid" class="bg-green-600 text-white px-4 py-2 rounded">
          Crear Subcategoría
        </button>
      </form>
    </div>
    
    <!-- Sección Importar Catálogo -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-3">Importar Catálogo de Aseguradora</h2>
      <input type="file" (change)="onFileSelected($event)" accept=".json" class="block mb-2 border p-2 rounded w-full">
      <button (click)="importCatalog()" class="bg-blue-600 text-white px-4 py-2 rounded">
        Importar
      </button>
      <div *ngIf="result" class="mt-4 bg-green-100 p-4 rounded">
        <p><strong>Servicios creados:</strong> {{ result.created }}</p>
        <p><strong>Servicios actualizados:</strong> {{ result.updated }}</p>
      </div>
    </div>
  </div>
  `
})
export class ImportServicesPage implements OnInit {
  services: Service[] = [];
  ensurances: Ensurance[] = [];
  categories: Category[] = [];
  subcategories: Subcategory[] = [];
  fileData: any;
  result: { created: number; updated: number } = { created: 0, updated: 0 };

  private baseUrl = 'http://localhost:8000';

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

  constructor(private http: HttpClient) {
    // Formulario para crear servicio
    this.serviceForm = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required),
      subcategory: new FormControl('', Validators.required),
      copay: new FormControl(0, [Validators.required, Validators.min(0)]),
      pay: new FormControl(0, [Validators.required, Validators.min(0)]),
      total: new FormControl(0, [Validators.required, Validators.min(0)])
    });
    // Formulario para editar servicio
    this.serviceEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required),
      subcategory: new FormControl('', Validators.required),
      copay: new FormControl(0, [Validators.required, Validators.min(0)]),
      pay: new FormControl(0, [Validators.required, Validators.min(0)]),
      total: new FormControl(0, [Validators.required, Validators.min(0)])
    });
    // Formulario para crear aseguradora
    this.ensuranceForm = new FormGroup({
      name: new FormControl('', Validators.required),
      coverageDescription: new FormControl('', Validators.required)
    });
    // Formulario para editar aseguradora
    this.ensuranceEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
      coverageDescription: new FormControl('', Validators.required)
    });
    // Formulario para crear categoría
    this.categoryForm = new FormGroup({
      name: new FormControl('', Validators.required)
    });
    // Formulario para editar categoría
    this.categoryEditForm = new FormGroup({
      name: new FormControl('', Validators.required)
    });
    // Formulario para crear subcategoría
    this.subcategoryForm = new FormGroup({
      name: new FormControl('', Validators.required)
    });
    // Formulario para editar subcategoría
    this.subcategoryEditForm = new FormGroup({
      name: new FormControl('', Validators.required)
    });
  }

  ngOnInit(): void {
    this.getServices();
    this.getEnsurances();
    this.getCategories();
    this.getSubcategories();
  }

  // Servicios
  getServices(): void {
    this.http.get<{ services: Service[] }>(`${this.baseUrl}/api/services/`).subscribe({
      next: (res) => this.services = res.services,
      error: (err) => console.error('Error cargando servicios', err)
    });
  }
  onSubmitService(): void {
    if (this.serviceForm.invalid) return;
    const newService: Service = this.serviceForm.value;
    this.http.post(`${this.baseUrl}/api/services/create/`, newService).subscribe({
      next: () => {
        this.getServices();
        this.serviceForm.reset();
      },
      error: (err) => console.error('Error creando servicio', err)
    });
  }
  deleteService(serviceId: string): void {
    this.http.delete(`${this.baseUrl}/api/services/${serviceId}/delete/`).subscribe({
      next: () => this.getServices(),
      error: (err) => console.error('Error eliminando servicio', err)
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
      total: service.total
    });
  }
  onSubmitServiceEdit(): void {
    if (!this.editingService || this.serviceEditForm.invalid) return;
    const updatedService: Service = this.serviceEditForm.value;
    this.http.put(`${this.baseUrl}/api/services/${this.editingService._id}/update/`, updatedService).subscribe({
      next: () => {
        this.getServices();
        this.editingService = null;
      },
      error: (err) => console.error('Error actualizando servicio', err)
    });
  }
  cancelEditService(): void {
    this.editingService = null;
  }

  // Aseguradoras
  getEnsurances(): void {
    this.http.get<{ ensurances: Ensurance[] }>(`${this.baseUrl}/api/ensurances/`).subscribe({
      next: (res) => this.ensurances = res.ensurances,
      error: (err) => console.error('Error cargando aseguradoras', err)
    });
  }
  onSubmitEnsurance(): void {
    if (this.ensuranceForm.invalid) return;
    const newEnsurance: Ensurance = this.ensuranceForm.value;
    this.http.post(`${this.baseUrl}/api/ensurances/create/`, newEnsurance).subscribe({
      next: () => {
        this.getEnsurances();
        this.ensuranceForm.reset();
      },
      error: (err) => console.error('Error creando aseguradora', err)
    });
  }
  deleteEnsurance(ensuranceId: string): void {
    this.http.delete(`${this.baseUrl}/api/ensurances/${ensuranceId}/delete/`).subscribe({
      next: () => this.getEnsurances(),
      error: (err) => console.error('Error eliminando aseguradora', err)
    });
  }
  onEditEnsurance(ensurance: Ensurance): void {
    this.editingEnsurance = ensurance;
    this.ensuranceEditForm.patchValue({
      name: ensurance.name,
      coverageDescription: ensurance.coverageDescription
    });
  }
  onSubmitEnsuranceEdit(): void {
    if (!this.editingEnsurance || this.ensuranceEditForm.invalid) return;
    const updatedEnsurance: Ensurance = this.ensuranceEditForm.value;
    this.http.put(`${this.baseUrl}/api/ensurances/${this.editingEnsurance._id}/update/`, updatedEnsurance).subscribe({
      next: () => {
        this.getEnsurances();
        this.editingEnsurance = null;
      },
      error: (err) => console.error('Error actualizando aseguradora', err)
    });
  }
  cancelEditEnsurance(): void {
    this.editingEnsurance = null;
  }

  // Categorías
  getCategories(): void {
    this.http.get<{ categories: Category[] }>(`${this.baseUrl}/api/categories/`).subscribe({
      next: (res) => this.categories = res.categories,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }
  onSubmitCategory(): void {
    if (this.categoryForm.invalid) return;
    const newCategory: Category = this.categoryForm.value;
    this.http.post(`${this.baseUrl}/api/categories/create/`, newCategory).subscribe({
      next: () => {
        this.getCategories();
        this.categoryForm.reset();
      },
      error: (err) => console.error('Error creando categoría', err)
    });
  }
  deleteCategory(categoryId: string): void {
    this.http.delete(`${this.baseUrl}/api/categories/${categoryId}/delete/`).subscribe({
      next: () => this.getCategories(),
      error: (err) => console.error('Error eliminando categoría', err)
    });
  }
  onEditCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryEditForm.patchValue({ name: category.name });
  }
  onSubmitCategoryEdit(): void {
    if (!this.editingCategory || this.categoryEditForm.invalid) return;
    const updatedCategory: Category = this.categoryEditForm.value;
    this.http.put(`${this.baseUrl}/api/categories/${this.editingCategory._id}/update/`, updatedCategory).subscribe({
      next: () => {
        this.getCategories();
        this.editingCategory = null;
      },
      error: (err) => console.error('Error actualizando categoría', err)
    });
  }
  cancelEditCategory(): void {
    this.editingCategory = null;
  }

  // Subcategorías
  getSubcategories(): void {
    this.http.get<{ subcategories: Subcategory[] }>(`${this.baseUrl}/api/subcategories/`).subscribe({
      next: (res) => this.subcategories = res.subcategories,
      error: (err) => console.error('Error cargando subcategorías', err)
    });
  }
  onSubmitSubcategory(): void {
    if (this.subcategoryForm.invalid) return;
    const newSubcategory: Subcategory = this.subcategoryForm.value;
    this.http.post(`${this.baseUrl}/api/subcategories/create/`, newSubcategory).subscribe({
      next: () => {
        this.getSubcategories();
        this.subcategoryForm.reset();
      },
      error: (err) => console.error('Error creando subcategoría', err)
    });
  }
  deleteSubcategory(subcategoryId: string): void {
    this.http.delete(`${this.baseUrl}/api/subcategories/${subcategoryId}/delete/`).subscribe({
      next: () => this.getSubcategories(),
      error: (err) => console.error('Error eliminando subcategoría', err)
    });
  }
  onEditSubcategory(subcategory: Subcategory): void {
    this.editingSubcategory = subcategory;
    this.subcategoryEditForm.patchValue({ name: subcategory.name });
  }
  onSubmitSubcategoryEdit(): void {
    if (!this.editingSubcategory || this.subcategoryEditForm.invalid) return;
    const updatedSubcategory: Subcategory = this.subcategoryEditForm.value;
    this.http.put(`${this.baseUrl}/api/subcategories/${this.editingSubcategory._id}/update/`, updatedSubcategory).subscribe({
      next: () => {
        this.getSubcategories();
        this.editingSubcategory = null;
      },
      error: (err) => console.error('Error actualizando subcategoría', err)
    });
  }
  cancelEditSubcategory(): void {
    this.editingSubcategory = null;
  }

  // Importar catálogo
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.fileData = JSON.parse(reader.result as string);
      } catch {
        alert('El archivo no es un JSON válido');
      }
    };
    reader.readAsText(file);
  }
  importCatalog(): void {
    if (!this.fileData?.services) {
      alert('Selecciona un archivo JSON válido con el campo "services"');
      return;
    }
    this.http.post<{ created: number; updated: number }>(
      `${this.baseUrl}/api/services_ensurance/import/`,
      this.fileData
    ).subscribe({
      next: (res) => this.result = res,
      error: (err) => alert('Error importando: ' + (err.error?.error || err.message))
    });
  }
}
