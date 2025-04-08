import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { back_url } from '../environments/back_url';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Configura los headers por defecto para todas las solicitudes
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  /**
   * Realiza una petición GET
   * @param endpoint Endpoint de la API
   * @param params Parámetros opcionales
   */
  async get<T>(endpoint: string, params: any = {}): Promise<Observable<T>> {
    const url = await back_url();
    const options = {
      headers: this.getHeaders(),
      params,
      withCredentials: true, // Importante para CORS con credenciales
    };
    return this.http.get<T>(`${url}${endpoint}`, options);
  }

  /**
   * Realiza una petición POST
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   */
  async post<T>(endpoint: string, data: any): Promise<Observable<T>> {
    const options = {
      headers: this.getHeaders(),
      withCredentials: true,
    };
    const url = await back_url();
    return this.http.post<T>(`${url}${endpoint}`, data, options);
  }

  /**
   * Realiza una petición PUT
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   */
  async put<T>(endpoint: string, data: any): Promise<Observable<T>> {
    const url = await back_url();
    const options = {
      headers: this.getHeaders(),
      withCredentials: true,
    };
    return this.http.put<T>(`${url}${endpoint}`, data, options);
  }

  /**
   * Realiza una petición DELETE
   * @param endpoint Endpoint de la API
   */
  async delete<T>(endpoint: string): Promise<Observable<T>> {
    const url = await back_url();
    const options = {
      headers: this.getHeaders(),
      withCredentials: true,
    };
    return this.http.delete<T>(`${url}${endpoint}`, options);
  }
}
