import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import axios from 'axios';
import { HttpClient } from '@angular/common/http';

export interface Doctor {
  _id: string;
  username: string;
  email: string;
  rol: string;
  noLicencia?: string;
}

export interface Medicine {
  name: string;
  dosis: string;
  frequency: string;
  duration: string;
}

export interface Recipe {
  _id?: string;
  patient: string;
  code: string;
  medicines: Medicine[];
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  // Obtener lista de doctores
  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/lista_usuarios/`);
      return response.data.filter((user: Doctor) => user.rol === 'doctor');
    } catch (error) {
      console.error('Error al obtener doctores:', error);
      throw error;
    }
  }

  // Obtener recetas de un doctor específico
  async getDoctorRecipes(doctorId: string): Promise<Recipe[]> {
    try {
      const response = await this.http.get<Recipe[]>(`${this.apiUrl}/recipes/${doctorId}`).toPromise();
      return response || [];
    } catch (error) {
      console.error('Error fetching doctor recipes:', error);
      throw error;
    }
  }

  // Obtener todas las recetas (para administradores)
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/recipes`);
      return response.data.recipes;
    } catch (error) {
      console.error('Error al obtener todas las recetas:', error);
      throw error;
    }
  }

  // Actualizar información del doctor
  async updateDoctor(doctorId: string, data: Partial<Doctor>): Promise<void> {
    try {
      await axios.put(`${this.apiUrl}/actualizar_usuario/${doctorId}`, data);
    } catch (error) {
      console.error('Error al actualizar doctor:', error);
      throw error;
    }
  }

  // Eliminar doctor
  async deleteDoctor(doctorId: string): Promise<void> {
    try {
      await axios.delete(`${this.apiUrl}/borrar_usuario/${doctorId}`);
    } catch (error) {
      console.error('Error al eliminar doctor:', error);
      throw error;
    }
  }

  // Obtener un doctor específico
  async getDoctor(doctorId: string): Promise<Doctor> {
    try {
      const response = await axios.get(`${this.apiUrl}/obtener_usuario/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener doctor:', error);
      throw error;
    }
  }

  async createRecipe(recipe: Recipe): Promise<Recipe> {
    try {
      const response = await this.http.post<Recipe>(`${this.apiUrl}/recipes`, recipe).toPromise();
      return response!;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
} 