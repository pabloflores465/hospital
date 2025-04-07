import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import axios from 'axios';
import { back_url } from '../../environments/back_url';
interface ModerationChange {
  _id: string;
  old_val: { [key: string]: any };
  new_val: { [key: string]: any };
  page_id: { page_id: string; page_name: string };
}

@Component({
  selector: 'moderation-component',
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold text-center mb-6">Moderation Changes</h1>
      <div
        *ngFor="let change of moderationChanges()"
        class="mb-8 border rounded p-4 shadow"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">
            Page: {{ change.page_id.page_name }}
          </h2>
          <div>
            <button
              (click)="
                approveChange(
                  change.page_id.page_name,
                  change.page_id.page_id,
                  change.new_val
                )
              "
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Aprobar
            </button>
            <button
              (click)="rejectChange(change.page_id.page_id)"
              class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Rechazar
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white shadow-md rounded p-4">
            <h3 class="text-xl font-bold mb-2">Valor Antiguo</h3>
            <div *ngIf="isEmpty(change.old_val)">
              <p class="text-gray-600">No hay datos anteriores</p>
            </div>
            <div *ngFor="let pair of change.old_val | keyvalue">
              <p>
                <span class="font-semibold">{{ pair.key }}:</span>
                {{ pair.value }}
              </p>
            </div>
          </div>
          <div class="bg-white shadow-md rounded p-4">
            <h3 class="text-xl font-bold mb-2">Valor Nuevo</h3>
            <div *ngIf="isEmpty(change.new_val)">
              <p class="text-gray-600">No hay nuevos datos</p>
            </div>
            <div *ngFor="let pair of change.new_val | keyvalue">
              <p>
                <span class="font-semibold">{{ pair.key }}:</span>
                {{ pair.value }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModerationComponent implements OnInit {
  moderationChanges = signal<ModerationChange[]>([]);

  async ngOnInit() {
    await this.get_changes();
  }

  async get_changes() {
    const url = await back_url();
    axios
      .get(`${url}/moderation`)
      .then((response) => {
        this.moderationChanges.set(response.data.message);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async approveChange(page_name: string, page_id: string, new_value: any) {
    const url = await back_url();
    const payload = { ...new_value, _id: page_id };
    axios
      .post(`${url}/${page_name}/update/`, payload)
      .then((response) => console.log(response.data))
      .catch((error) => console.log(error));
    axios
      .put(`${url}/moderation/clear/${page_id}`)
      .then((response) => console.log(response.data))
      .catch((error) => console.log(error));
    this.get_changes();
  }

  async rejectChange(page_id: string) {
    const url = await back_url();
    axios
      .put(`${url}/moderation/clear/${page_id}`)
      .then((response) => console.log(response.data))
      .catch((error) => console.log(error));
    this.get_changes();
  }

  isEmpty(obj: Object): boolean {
    return Object.keys(obj).length === 0;
  }
}
