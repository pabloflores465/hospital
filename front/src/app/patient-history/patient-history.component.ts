import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PatientHistory {
  id: number;
  name: string;
  diagnoses: string[];
  procedures: string[];
  examResults: string;
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.css']
})
export class PatientHistoryComponent implements OnInit {
  histories: PatientHistory[] = [];
  searchTerm: string = '';
  filteredHistories: PatientHistory[] = [];
  
  ngOnInit(): void {
    this.loadMockHistories();
    this.filteredHistories = this.histories;
  }
  
  loadMockHistories(): void {
    this.histories = [
      {
        id: 1,
        name: 'Paciente 1',
        diagnoses: ['Hipertensión', 'Diabetes'],
        procedures: ['ECG', 'Examen de sangre'],
        examResults: 'Resultados normales'
      },
      {
        id: 2,
        name: 'Paciente 2',
        diagnoses: ['Asma'],
        procedures: ['Espirometría'],
        examResults: 'Leve deterioro pulmonar'
      }
    ];
  }
  
  searchHistories(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredHistories = this.histories.filter(history =>
      history.name.toLowerCase().includes(term)
    );
  }
}
