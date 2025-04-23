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
      </div>
      
      <!-- Estado de carga -->
      <div *ngIf="loading" class="text-center py-6">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="mt-2">Cargando recetas...</p>
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
                   (click)="sendEmail(recipe._id)">
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
  loading = true;
  error = '';
  
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
    const userEmail = localStorage.getItem('userEmail');
    
    if (!user || (!user._id && !userEmail)) {
      this.error = 'No se pudo identificar al usuario actual';
      this.loading = false;
      return;
    }
    
    // Primero intentamos usar el email desde localStorage
    if (userEmail) {
      console.log('Cargando recetas por email:', userEmail);
      
      this.http.get<any>(`http://0.0.0.0:5050/recipes/email/${userEmail}`).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response && response.recipes) {
            this.recipes = response.recipes;
            
            // Ordenar por fecha (más reciente primero)
            this.recipes.sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          } else {
            this.recipes = [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar recetas por email:', err);
          
          // Si falla la carga por email, intentamos por ID de usuario como fallback
          if (user && user._id) {
            this.loadRecipesByUserId(user._id);
          } else {
            this.error = 'No se pudieron cargar las recetas. Por favor, intenta nuevamente.';
            this.loading = false;
          }
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
    
    this.http.get<any>(`http://0.0.0.0:5050/recipes/patient/${userId}`).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response && response.recipes) {
          this.recipes = response.recipes;
          
          // Ordenar por fecha (más reciente primero)
          this.recipes.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        } else {
          this.recipes = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar recetas por ID:', err);
        this.error = 'No se pudieron cargar las recetas. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }
  
  sendEmail(recipeId: string): void {
    this.http.post(`http://0.0.0.0:5050/recipes/send-email/${recipeId}`, {}).subscribe({
      next: () => {
        alert('Receta enviada correctamente a tu correo.');
      },
      error: (err) => {
        console.error('Error al enviar email:', err);
        alert('Error al enviar el correo. Inténtalo más tarde.');
      }
    });
  }
} 