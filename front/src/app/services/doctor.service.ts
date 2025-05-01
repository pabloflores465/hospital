import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import axios from 'axios';
import { HttpClient } from '@angular/common/http';
import { back_url } from '../../environments/back_url';
import { firstValueFrom } from 'rxjs';

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
  providedIn: 'root',
})
export class DoctorService {
  constructor(private http: HttpClient) {}

  // Obtener lista de doctores
  async getDoctors(): Promise<Doctor[]> {
    try {
      const url = await back_url();
      const response = await axios.get(`${url}/lista_usuarios/`);
      return response.data.filter((user: Doctor) => user.rol === 'doctor');
    } catch (error) {
      console.error('Error al obtener doctores:', error);
      throw error;
    }
  }

  // Obtener recetas de un doctor específico
  async getDoctorRecipes(doctorId: string): Promise<Recipe[]> {
    try {
      const url = await back_url();
      const response = await firstValueFrom(this.http.get<Recipe[]>(`${url}/recipes/${doctorId}`));
      return response || [];
    } catch (error) {
      console.error('Error fetching doctor recipes:', error);
      throw error;
    }
  }

  // Obtener todas las recetas (para administradores)
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const url = await back_url();
      const response = await axios.get(`${url}/recipes`);
      return response.data.recipes;
    } catch (error) {
      console.error('Error al obtener todas las recetas:', error);
      throw error;
    }
  }

  // Actualizar información del doctor
  async updateDoctor(doctorId: string, data: Partial<Doctor>): Promise<void> {
    try {
      const url = await back_url();
      await axios.put(`${url}/actualizar_usuario/${doctorId}`, data);
    } catch (error) {
      console.error('Error al actualizar doctor:', error);
      throw error;
    }
  }

  // Eliminar doctor
  async deleteDoctor(doctorId: string): Promise<void> {
    try {
      const url = await back_url();
      await axios.delete(`${url}/borrar_usuario/${doctorId}`);
    } catch (error) {
      console.error('Error al eliminar doctor:', error);
      throw error;
    }
  }

  // Obtener un doctor específico
  async getDoctor(doctorId: string): Promise<Doctor> {
    try {
      const url = await back_url();
      const response = await axios.get(`${url}/obtener_usuario/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener doctor:', error);
      throw error;
    }
  }

  async createRecipe(recipe: Recipe): Promise<Recipe> {
    try {
      const url = await back_url();
      const response = await firstValueFrom(this.http.post<Recipe>(`${url}/recipes`, recipe));
      return response;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
}
