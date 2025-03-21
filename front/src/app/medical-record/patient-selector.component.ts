import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { MedicalRecordService } from '../services/medical-record.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-patient-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold mb-6">Seleccionar Paciente</h1>
        
        <div *ngIf="isLoading" class="flex justify-center items-center p-8">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span class="ml-3 text-gray-700">Cargando pacientes...</span>
        </div>
        
        <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span class="block sm:inline">{{ errorMessage }}</span>
        </div>
        
        <div *ngIf="!isLoading && !errorMessage">
          <div *ngIf="patients.length === 0" class="text-center py-8 text-gray-500">
            <p class="mb-2 text-xl">No se encontraron pacientes asignados</p>
            <p>No hay pacientes con registros médicos asignados a usted. Esto puede deberse a:</p>
            <ul class="list-disc mt-2 pl-6 text-left max-w-md mx-auto">
              <li>No tiene pacientes asignados aún</li>
              <li>Sus pacientes no tienen registros médicos creados</li>
              <li>Es necesario actualizar las asignaciones de pacientes</li>
            </ul>
            <p class="mt-4">Por favor, contacte al administrador si necesita ayuda.</p>
          </div>
          
          <div *ngIf="patients.length > 0">
            <p class="mb-4 text-green-600 font-medium">Mostrando {{ patients.length }} pacientes con registros médicos</p>
            
            <div class="mb-4">
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (input)="filterPatients()"
                placeholder="Buscar paciente..." 
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let patient of filteredPatients" 
                  class="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                  (click)="selectPatient(patient)">
                <h3 class="text-lg font-semibold">{{ patient.name || patient.username }}</h3>
                <p class="text-gray-600">{{ patient.email }}</p>
                <p *ngIf="patient.identification" class="text-sm text-gray-500">DPI: {{ patient.identification }}</p>
                <div class="mt-2 text-right">
                  <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                    Ver Ficha
                  </button>
                </div>
              </div>
            </div>
            
            <div *ngIf="filteredPatients.length === 0 && searchTerm" class="text-center py-8 text-gray-500">
              No se encontraron pacientes con el término "{{ searchTerm }}".
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PatientSelectorComponent implements OnInit {
  patients: User[] = [];
  filteredPatients: User[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  currentDoctor: User | null = null;
  
  constructor(
    private router: Router,
    private userService: UserService,
    private medicalRecordService: MedicalRecordService
  ) {}
  
  ngOnInit(): void {
    // Obtenemos el doctor real que está logueado en el sistema
    this.currentDoctor = this.userService.getUser();
    console.log('Doctor logueado:', this.currentDoctor);
    
    if (!this.currentDoctor) {
      this.errorMessage = 'Es necesario iniciar sesión para acceder a esta página';
      this.isLoading = false;
      return;
    }
    
    if (this.currentDoctor.rol.toLowerCase() !== 'doctor') {
      this.errorMessage = 'Solo los doctores pueden acceder a esta página';
      this.isLoading = false;
      return;
    }
    
    this.loadPatients();
  }
  
  loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Verificamos que exista un doctor logueado
    if (!this.currentDoctor || !this.currentDoctor._id) {
      this.errorMessage = 'Error: No hay un doctor autenticado';
      this.isLoading = false;
      return;
    }

    console.log('Doctor actual:', this.currentDoctor);
    
    // Obtenemos los pacientes asignados al doctor logueado, cualquiera que sea
    this.medicalRecordService.getPatientsAssignedToDoctor(this.currentDoctor._id).subscribe({
      next: (response) => {
        console.log('Respuesta de pacientes asignados:', response);
        if (response && response.patients && response.patients.length > 0) {
          this.patients = response.patients;
          this.filteredPatients = [...this.patients];
          this.isLoading = false;
        } else {
          console.log('No se encontraron pacientes asignados');
          this.patients = [];
          this.filteredPatients = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al obtener pacientes asignados:', error);
        this.errorMessage = `Error al obtener pacientes asignados: ${error.message || error.statusText || 'Error desconocido'}`;
        this.isLoading = false;
      }
    });
  }
  
  filterPatients(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = [...this.patients];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient => 
      (patient.name?.toLowerCase().includes(term) || 
       patient.username?.toLowerCase().includes(term) || 
       patient.email?.toLowerCase().includes(term) || 
       patient.identification?.toLowerCase().includes(term))
    );
  }
  
  selectPatient(patient: User): void {
    // Navegar a la ficha médica del paciente seleccionado
    this.router.navigate(['/medical-record', patient._id]);
  }
} 