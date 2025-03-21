import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-hospital-history',
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
        {{ history().title }}
      </h1>
      <div class="bg-white shadow-md rounded-lg p-6">
        <p class="text-gray-700 text-lg">
          {{ history().content }}
        </p>
      </div>
    </div>
  `,
})
export class HospitalHistoryComponent {
  history = signal<{ _id: string; title: string; content: string }>({
    _id: '',
    title: '',
    content: '',
  });

  async ngOnInit() {
    await this.getHistory();
  }

  async getHistory() {
    axios
      .get('http://127.0.0.1:8000/history/')
      .then((response) => {
        this.history.set(response.data.history);
        console.log(this.history);
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
