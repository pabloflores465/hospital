import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { back_url } from '../../environments/back_url';

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordService {
  // Caché local de servicios
  private servicesCache: { [key: string]: any } = {};

  constructor(private http: HttpClient) {}

  // Crear o actualizar ficha médica
  async createMedicalRecord(data: any): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(`${url}/medical-records/create/`, data);
  }

  // Agregar procedimiento médico
  async addMedicalProcedure(data: any): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(`${url}/medical-records/procedure/add/`, data);
  }

  // Agregar comentario
  async addComment(data: any): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(`${url}/medical-records/comment/add/`, data);
  }

  // Obtener ficha médica de un paciente
  async getPatientRecord(patientId: string): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.get(`${url}/medical-records/patient/${patientId}/`);
  }

  // Subir archivo adjunto
  async uploadAttachment(formData: FormData): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(
      `${url}/medical-records/attachment/upload/`,
      formData
    );
  }

  async getAttachment(attachmentId: string): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.get(`${url}/medical-records/attachment/${attachmentId}/`, {
      responseType: 'blob',
    });
  }

  // Obtener información de un servicio por su ID
  async getServiceById(serviceId: string): Promise<Observable<any>> {
    // Si tenemos el servicio en caché, lo devolvemos
    if (this.servicesCache[serviceId]) {
      return of(this.servicesCache[serviceId]);
    }

    // Si no, lo obtenemos del servidor
    const url = await back_url();
    return this.http.get(`${url}/services/${serviceId}/`);
  }

  // Para desarrollo, obtener nombre amigable del servicio basado en su ID
  getServiceNameById(serviceId: string): string {
    const serviceMap: { [key: string]: string } = {
      '67dd0af00d9fcd8d2fc7a1fc': 'Análisis clínicos',
      '67ccd7f04a50edb1905bb9d6': 'Encamamiento',
      '67dbb02649f7c6f5b79349f6': 'Nuevo Servicio',
      '67dc556e0bb9add4bd4baabd': 'Servicio de Limpieza',
      '67cce2db38fba0c8d835382e': 'Análisis clínicos',
    };

    return serviceMap[serviceId] || `Servicio ${serviceId.substring(0, 6)}...`;
  }

  // Obtener pacientes asignados a un doctor específico
  async getPatientsAssignedToDoctor(
    doctorId: string
  ): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.get<any>(
      `${url}/medical-records/doctor/${doctorId}/patients/`
    );
  }
}
