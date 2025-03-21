import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000';

  // Caché local de servicios
  private servicesCache: { [key: string]: any } = {};

  constructor(private http: HttpClient) {}

  // Crear o actualizar ficha médica
  createMedicalRecord(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/medical-records/create/`, data);
  }

  // Agregar procedimiento médico
  addMedicalProcedure(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/medical-records/procedure/add/`, data);
  }

  // Agregar comentario
  addComment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/medical-records/comment/add/`, data);
  }

  // Obtener ficha médica de un paciente
  getPatientRecord(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/medical-records/patient/${patientId}/`);
  }

  // Subir archivo adjunto
  uploadAttachment(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/medical-records/attachment/upload/`, formData);
  }

  getAttachment(attachmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/medical-records/attachment/${attachmentId}/`, { responseType: 'blob' });
  }

  // Obtener información de un servicio por su ID
  getServiceById(serviceId: string): Observable<any> {
    // Si tenemos el servicio en caché, lo devolvemos
    if (this.servicesCache[serviceId]) {
      return of(this.servicesCache[serviceId]);
    }
    
    // Si no, lo obtenemos del servidor
    return this.http.get(`${this.apiUrl}/services/${serviceId}/`);
  }

  // Para desarrollo, obtener nombre amigable del servicio basado en su ID
  getServiceNameById(serviceId: string): string {
    const serviceMap: {[key: string]: string} = {
      '67dd0af00d9fcd8d2fc7a1fc': 'Análisis clínicos',
      '67ccd7f04a50edb1905bb9d6': 'Encamamiento',
      '67dbb02649f7c6f5b79349f6': 'Nuevo Servicio',
      '67dc556e0bb9add4bd4baabd': 'Servicio de Limpieza',
      '67cce2db38fba0c8d835382e': 'Análisis clínicos'
    };
    
    return serviceMap[serviceId] || `Servicio ${serviceId.substring(0, 6)}...`;
  }

  // Obtener pacientes asignados a un doctor específico
  getPatientsAssignedToDoctor(doctorId: string): Observable<any> {
    console.log(`Solicitando pacientes para el doctor ${doctorId}`);
    return this.http.get<any>(`${this.apiUrl}/medical-records/doctor/${doctorId}/patients/`);
  }
} 