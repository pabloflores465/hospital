import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mis-recetas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-xl font-bold mb-4">Mis Recetas Médicas</h2>
      
      <div *ngIf="cargando" class="text-center">
        <p>Cargando recetas...</p>
      </div>
      
      <div *ngIf="errorMensaje" class="bg-red-100 p-4 rounded mb-4">
        <p>{{ errorMensaje }}</p>
      </div>
      
      <div *ngIf="!cargando && !errorMensaje && recetas.length === 0" class="text-center">
        <p>No tienes recetas para mostrar.</p>
      </div>
      
      <div *ngIf="recetas.length > 0" class="space-y-6">
        <div *ngFor="let receta of recetas" class="bg-white shadow rounded-lg p-4">
          <div class="mb-3">
            <h3 class="font-bold text-lg">Receta #{{ receta.code }}</h3>
            <p class="text-sm text-gray-600">{{ receta.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm text-gray-600">Médico:</p>
            <p>{{ receta.doctor_details?.username || receta.doctor }}</p>
          </div>
          
          <div class="mb-3">
            <div class="flex justify-between items-center">
              <p class="text-sm font-medium">Medicamentos ({{ receta.medicines?.length || 0 }}):</p>
            </div>
            
            <!-- Mostrar todos los medicamentos directamente -->
            <div *ngFor="let med of receta.medicines" class="bg-gray-50 p-2 rounded mt-1">
              <p><strong>{{ med.principioActivo || med.name }}</strong> {{ med.concentracion }}</p>
              <p class="text-sm">{{ med.presentacion }} - {{ med.formaFarmaceutica }}</p>
              <div class="text-xs text-gray-600 grid grid-cols-3 gap-2 mt-1">
                <p>Dosis: {{ med.dosis }}</p>
                <p>Frecuencia: {{ med.frecuencia || med.frequency }}</p>
                <p>Duración: {{ med.duracion || med.duration }}</p>
              </div>
              <p class="text-xs mt-1">Diagnóstico: {{ med.diagnostico }}</p>
            </div>
          </div>
          
          <div *ngIf="receta.special_notes" class="text-sm mb-3">
            <p class="font-medium">Notas:</p>
            <p class="italic">{{ receta.special_notes }}</p>
          </div>
          
          <div class="flex justify-end">
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" 
                  (click)="enviarPorEmail(receta._id)">
              Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
    }
    
    button {
      transition: all 0.2s;
    }
  `]
})
export class MisRecetasComponent implements OnInit {
  recetas: any[] = [];
  cargando = true;
  errorMensaje = '';
  usuarioId = '';

  constructor(private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    // En una implementación real, obtendrías el ID del usuario desde un servicio de autenticación
    // Para pruebas, usamos el ID conocido
    this.usuarioId = '67d985d0ba17ad09ee384993';

    // Verificar que la API está accesible
    const url = await back_url();
    this.http.get(`${url}/`).subscribe({
      next: () => {
        console.log('Conexión con el backend establecida');
        this.cargarRecetas();
      },
      error: (error) => {
        console.error('Error al conectar con el backend:', error);
        this.errorMensaje =
          'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
        this.cargando = false;
      },
    });
  }

  async cargarRecetas(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';

    console.log('Cargando recetas para el usuario:', this.usuarioId);

    const url = await back_url();
    this.http.get<any>(`${url}/recipes/patient/${this.usuarioId}`).subscribe({
      next: (response) => {
        console.log('Respuesta completa del API:', response);

        if (response.recipes && Array.isArray(response.recipes)) {
          this.recetas = response.recipes;
          console.log('Recetas cargadas:', this.recetas.length);

          // Ordenar las recetas de más reciente a más antigua
          this.recetas.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB.getTime() - dateA.getTime(); // Orden descendente
          });
        } else {
          console.error(
            'La respuesta no contiene un array de recetas:',
            response
          );
          this.recetas = [];
          this.errorMensaje = 'La estructura de datos recibida no es válida';
        }

        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar las recetas:', error);
        this.errorMensaje =
          'No se pudieron cargar tus recetas. Por favor, intenta más tarde.';
        this.cargando = false;
      },
    });
  }

  async enviarPorEmail(recetaId: string): Promise<void> {
    const url = await back_url();
    this.http.post(`${url}/recipes/send-email/${recetaId}`, {}).subscribe({
      next: (response: any) => {
        console.log('Receta enviada por email:', response);
        alert('Receta enviada a tu correo electrónico correctamente');
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