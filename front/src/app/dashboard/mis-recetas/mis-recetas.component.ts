import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { back_url } from '../../environments/back_url';
@Component({
  selector: 'app-mis-recetas',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">Mis Recetas Médicas</h1>

      <div *ngIf="cargando" class="text-center py-8">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"
        ></div>
        <p class="mt-3">Cargando tus recetas...</p>
      </div>

      <div
        *ngIf="!cargando && errorMensaje"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-bold">Error:</p>
        <p>{{ errorMensaje }}</p>
        <button
          (click)="cargarRecetas()"
          class="mt-3 bg-red-200 hover:bg-red-300 px-4 py-2 rounded"
        >
          Intentar nuevamente
        </button>
      </div>

      <div
        *ngIf="!cargando && !errorMensaje && recetas.length === 0"
        class="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center"
      >
        <p class="text-xl">No tienes recetas médicas registradas.</p>
        <p class="mt-2 text-gray-600">
          Cuando un médico te genere una receta, aparecerá aquí.
        </p>
        <p class="mt-4">ID de usuario utilizado: {{ usuarioId }}</p>
      </div>

      <div *ngIf="!cargando && recetas.length > 0" class="space-y-6">
        <div
          *ngFor="let receta of recetas"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="text-xl font-semibold">
                Receta #{{ receta.formatted_code || receta.code }}
              </h2>
              <p class="text-gray-600">
                {{
                  receta.formatted_date ||
                    (receta.created_at | date : 'dd/MM/yyyy HH:mm')
                }}
              </p>
            </div>
            <div>
              <span
                class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {{ receta.has_insurance ? 'Con seguro' : 'Sin seguro' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm font-medium text-gray-600">Médico:</p>
              <p>{{ receta.doctor_details?.username || receta.doctor }}</p>
              <p class="text-sm text-gray-600">
                {{
                  receta.doctor_details?.especialidad ||
                    'Especialidad no especificada'
                }}
              </p>
            </div>
          </div>

          <div class="mb-4">
            <p class="font-medium mb-2">Medicamentos:</p>
            <div
              *ngFor="let med of receta.medicines"
              class="bg-gray-50 p-3 rounded mb-2"
            >
              <p class="font-medium">
                {{ med.principioActivo }} {{ med.concentracion }}
              </p>
              <p>{{ med.presentacion }} - {{ med.formaFarmaceutica }}</p>
              <div
                class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-700"
              >
                <p><span class="font-medium">Dosis:</span> {{ med.dosis }}</p>
                <p>
                  <span class="font-medium">Frecuencia:</span>
                  {{ med.frecuencia }}
                </p>
                <p>
                  <span class="font-medium">Duración:</span> {{ med.duracion }}
                </p>
              </div>
              <p class="text-sm mt-2">
                <span class="font-medium">Diagnóstico:</span>
                {{ med.diagnostico }}
              </p>
            </div>
          </div>

          <div *ngIf="receta.special_notes" class="mt-4 border-t pt-3">
            <p class="font-medium">Notas Especiales:</p>
            <p class="text-gray-700">{{ receta.special_notes }}</p>
          </div>

          <div class="flex justify-end space-x-2 mt-4">
            <button class="px-4 py-2 bg-green-600 text-white rounded">
              Descargar PDF
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded"
              (click)="enviarPorEmail(receta._id)"
            >
              Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MisRecetasComponent implements OnInit {
  recetas: any[] = [];
  cargando = true;
  errorMensaje = '';
  usuarioId = ''; // Esto debería venir de un servicio de autenticación

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
