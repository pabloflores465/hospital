import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl || 'http://127.0.0.1:8000'; // URL por defecto
  
  constructor(private http: HttpClient) { }
  
  /**
   * Configura los headers por defecto para todas las solicitudes
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
  
  /**
   * Realiza una petición GET
   * @param endpoint Endpoint de la API
   * @param params Parámetros opcionales
   */
  get<T>(endpoint: string, params: any = {}): Observable<T> {
    const options = {
      headers: this.getHeaders(),
      params,
      withCredentials: true // Importante para CORS con credenciales
    };
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options);
  }
  
  /**
   * Realiza una petición POST
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const options = {
      headers: this.getHeaders(),
      withCredentials: true
    };
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options);
  }
  
  /**
   * Realiza una petición PUT
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const options = {
      headers: this.getHeaders(),
      withCredentials: true
    };
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, options);
  }
  
  /**
   * Realiza una petición DELETE
   * @param endpoint Endpoint de la API
   */
  delete<T>(endpoint: string): Observable<T> {
    const options = {
      headers: this.getHeaders(),
      withCredentials: true
    };
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options);
  }
} 