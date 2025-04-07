import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { back_url } from '../../environments/back_url';

interface AuditItem {
  _id: string;
  page_id: {
    page_id: string;
    page_name: string;
  };
  // Como las propiedades de cada value pueden variar, se tipifica como un objeto genérico.
  values: any[];
}

interface AuditResponse {
  message: AuditItem[];
}

@Component({
  selector: 'app-audit',
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Datos de Auditoría</h1>

      <!-- Mensaje de error -->
      <div *ngIf="error" class="text-red-500 mb-4">{{ error }}</div>

      <!-- Mensaje de carga -->
      <div *ngIf="!auditData.length && !error" class="text-gray-500">
        Cargando datos...
      </div>

      <!-- Mapeo de datos -->
      <div
        *ngFor="let item of auditData"
        class="mb-8 border p-4 rounded shadow"
      >
        <h2 class="text-xl font-semibold mb-2">
          Página: {{ item.page_id.page_name }}
        </h2>
        <div *ngFor="let value of item.values" class="mb-4 border p-2 rounded">
          <!-- Iteramos sobre todas las propiedades del objeto value -->
          <div *ngFor="let key of getKeys(value)" class="mb-1">
            <strong>{{ key }}:</strong> {{ value[key] }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  auditData: AuditItem[] = [];
  error: string | null = null;

  constructor() {}

  async ngOnInit(): Promise<void> {
    const url = await back_url();
    axios
      .get<AuditResponse>(`${url}/audit`)
      .then((response) => {
        this.auditData = response.data.message;
      })
      .catch((err) => {
        console.error('Error al obtener los datos:', err);
        this.error = 'Ocurrió un error al cargar los datos.';
      });
  }

  // Función para obtener las claves de un objeto de forma dinámica.
  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
