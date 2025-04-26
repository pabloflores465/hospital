import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { recipeService } from '../../../services/recipeService';

@Component({
  selector: 'app-user-recipes',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Mis Recetas Médicas</h2>
        <button 
          (click)="testConnection()" 
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Probar conexión
        </button>
      </div>
      
      <!-- Estado de carga -->
      <div *ngIf="loading" class="text-center py-6">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="mt-2">Cargando recetas...</p>
      </div>
      
      <!-- Mensaje de éxito de conexión -->
      <div *ngIf="connectionStatus" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
        <p>{{ connectionStatus }}</p>
      </div>
      
      <!-- Mensaje de éxito -->
      <div *ngIf="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
        <p>{{ successMessage }}</p>
      </div>
      
      <!-- Mensaje de error -->
      <div *ngIf="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{{ error }}</p>
        <button (click)="loadRecipes()" class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded">
          Reintentar
        </button>
      </div>
      
      <!-- Sin recetas -->
      <div *ngIf="!loading && !error && recipes.length === 0" class="bg-gray-100 p-4 rounded text-center">
        <p>No tienes recetas médicas en este momento.</p>
      </div>
      
      <!-- Lista de recetas -->
      <div *ngIf="!loading && recipes.length > 0" class="space-y-4">
        <div *ngFor="let recipe of recipes" class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="font-bold text-lg">Receta #{{ recipe.formatted_code || recipe.code }}</h3>
              <p class="text-sm text-gray-600">{{ recipe.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {{ recipe.has_insurance ? 'Con seguro' : 'Sin seguro' }}
            </span>
          </div>
          
          <div class="mb-3">
            <p class="text-sm text-gray-600">Médico:</p>
            <p>{{ recipe.doctor_details?.username || recipe.doctor }}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-medium">Medicamentos:</p>
            <div *ngFor="let med of recipe.medicines" class="bg-gray-50 p-2 rounded mt-1">
              <p><strong>{{ med.principioActivo }}</strong> {{ med.concentracion }}</p>
              <p class="text-sm">{{ med.presentacion }} - {{ med.formaFarmaceutica }}</p>
              <div class="text-xs text-gray-600 grid grid-cols-3 gap-2 mt-1">
                <p>Dosis: {{ med.dosis }}</p>
                <p>Frecuencia: {{ med.frecuencia }}</p>
                <p>Duración: {{ med.duracion }}</p>
              </div>
              <p class="text-xs mt-1">Diagnóstico: {{ med.diagnostico }}</p>
            </div>
          </div>
          
          <div *ngIf="recipe.special_notes" class="text-sm mb-3">
            <p class="font-medium">Notas:</p>
            <p class="italic">{{ recipe.special_notes }}</p>
          </div>
          
          <div class="flex justify-end space-x-2">
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" 
                   (click)="sendRecipeByEmail(recipe._id)">
              Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserRecipesComponent implements OnInit {
  recipes: any[] = [];
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  connectionStatus: string = '';
  patient: any = {};
  
  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    this.loadRecipes();
  }
  
  loadRecipes(): void {
    this.loading = true;
    this.error = '';
    
    const user = this.userService.getUser();
    console.log('Usuario actual:', user);
    
    // Obtener el email desde localStorage
    const userEmail = localStorage.getItem('userEmail') || user?.email;
    
    if (userEmail) {
      console.log('Cargando recetas por email:', userEmail);
      
      recipeService.getRecipesByEmail(userEmail)
        .then(recipes => {
          console.log('Recetas obtenidas por email:', recipes);
          this.recipes = recipes;
          this.loading = false;
          
          if (recipes.length === 0) {
            console.log('No se encontraron recetas, intentando cargar por ID de usuario...');
            // Si no encontramos recetas por email, intentemos por ID
            if (user && user._id) {
              this.loadRecipesByUserId(user._id);
            }
          }
        })
        .catch(err => {
          console.error('Error al cargar recetas por email:', err);
          
          // Mostrar detalles específicos del error para depuración
          if (err.response) {
            // El servidor respondió con un código de estado que no está en el rango 2xx
            console.error('Respuesta de error:', err.response.data);
            console.error('Estado HTTP:', err.response.status);
            this.error = `Error ${err.response.status}: ${err.response.data?.error || 'Error desconocido'}`;
          } else if (err.request) {
            // La petición se hizo pero no se recibió respuesta
            console.error('No se recibió respuesta del servidor');
            this.error = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
          } else {
            // Ocurrió un error al configurar la petición
            console.error('Error de configuración:', err.message);
            this.error = `Error: ${err.message}`;
          }
          
          // Si falla la carga por email, intentamos por ID de usuario como fallback
          if (user && user._id) {
            this.loadRecipesByUserId(user._id);
          } else {
            this.loading = false;
        }
      });
    } else if (user && user._id) {
      // Si no hay email en localStorage, usamos el ID del usuario
      this.loadRecipesByUserId(user._id);
    } else {
      this.error = 'No se pudo identificar al usuario actual';
      this.loading = false;
    }
  }
  
  loadRecipesByUserId(userId: string): void {
    console.log('Cargando recetas por ID de usuario:', userId);
    
    recipeService.getPatientRecipes(userId)
      .then(recipes => {
        console.log('Recetas obtenidas por ID:', recipes);
        this.recipes = recipes;
        this.loading = false;
      })
      .catch(err => {
        console.error('Error al cargar recetas por ID:', err);
        
        // Mostrar detalles específicos del error para depuración
        if (err.response) {
          // El servidor respondió con un código de estado que no está en el rango 2xx
          console.error('Respuesta de error:', err.response.data);
          console.error('Estado HTTP:', err.response.status);
          this.error = `Error ${err.response.status}: ${err.response.data?.error || 'Error desconocido'}`;
        } else if (err.request) {
          // La petición se hizo pero no se recibió respuesta
          console.error('No se recibió respuesta del servidor');
          this.error = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
        } else {
          // Ocurrió un error al configurar la petición
          console.error('Error de configuración:', err.message);
          this.error = `Error: ${err.message}`;
        }
        
        this.loading = false;
      });
  }
  
  sendRecipeByEmail(recipeId: string): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    console.log('Enviando receta por email:', recipeId);
    
    recipeService.sendRecipeByEmail(recipeId)
      .then(response => {
        console.log('Receta enviada por email:', response);
        this.successMessage = 'Receta enviada por email correctamente';
        this.loading = false;
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      })
      .catch(err => {
        console.error('Error al enviar la receta por email:', err);
        this.error = err.response?.data?.error || 'Error desconocido al enviar la receta por email';
        this.loading = false;
    });
  }
  
  testConnection(): void {
    this.loading = true;
    this.error = '';
    this.connectionStatus = '';
    
    recipeService.testConnectivity()
      .then(status => {
        console.log(status);
        this.connectionStatus = status;
        this.loading = false;
        
        // Si se detecta una conexión exitosa, intentar cargar recetas
        if (status.includes('exitosa')) {
          setTimeout(() => {
            this.loadRecipes();
          }, 1000);
        }
      })
      .catch(err => {
        console.error('Error al probar conectividad:', err);
        this.error = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
        this.loading = false;
    });
  }
} 