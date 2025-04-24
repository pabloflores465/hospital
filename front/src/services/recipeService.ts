import axios from 'axios';
import { Recipe } from '../app/services/doctor.service';

const API_URL = 'http://172.16.57.55:5050/';

export const recipeService = {
  async getUserRecipes(username: string): Promise<Recipe[]> {
    try {
      const response = await axios.get(`${API_URL}/recipes?username=${username}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.recipes)) {
        return response.data.recipes;
      } else {
        console.warn('Estructura de respuesta inesperada:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener recetas:', error);
      throw error;
    }
  },

  async getRecipesByEmail(email: string): Promise<Recipe[]> {
    try {
      const response = await axios.get(`${API_URL}/recipes/email/${email}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.recipes)) {
        return response.data.recipes;
      } else {
        console.warn('Estructura de respuesta inesperada:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener recetas por email:', error);
      throw error;
    }
  },

  async getPatientRecipes(patientId: string): Promise<Recipe[]> {
    try {
      const response = await axios.get(`${API_URL}/recipes/patient/${patientId}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.recipes)) {
        return response.data.recipes;
      } else {
        console.warn('Estructura de respuesta inesperada:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener recetas del paciente:', error);
      throw error;
    }
  }
}; 