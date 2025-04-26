import axios from 'axios';
import { Recipe } from '../app/services/doctor.service';

// Lista de posibles URLs de base del backend
const POSSIBLE_BACKENDS = [
  'http://192.168.0.21:5051',
  'http://localhost:5051',
  'http://127.0.0.1:5051',
  'http://192.168.0.21:5050',
  'http://localhost:5050',
  'http://127.0.0.1:5050',
  'http://192.168.0.21:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  // Añade cualquier otra posible URL aquí
];

// Lista de posibles prefijos de rutas API
const POSSIBLE_PREFIXES = ['', '/api', '/v1', '/api/v1'];

// Función para intentar una solicitud en múltiples endpoints
async function tryMultipleEndpoints(path: string, method: 'get' | 'post' = 'get', data: any = null): Promise<any> {
  let lastError: any = null;
  
  // Probar cada combinación de backend y prefijo
  for (const backend of POSSIBLE_BACKENDS) {
    for (const prefix of POSSIBLE_PREFIXES) {
      try {
        const url = `${backend}${prefix}${path}`;
        console.log(`Intentando ${method.toUpperCase()} a: ${url}`);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 5000
        };
        
        let response;
        if (method === 'get') {
          response = await axios.get(url, config);
        } else {
          response = await axios.post(url, data, config);
        }
        
        console.log(`¡Éxito! Respuesta de ${url}:`, response.data);
        return response;
      } catch (error: any) {
        const errorMessage = `Error en ${method.toUpperCase()} ${backend}${prefix}${path}: ${error.message}`;
        console.log(errorMessage);
        lastError = error;
        // Continuar con la siguiente combinación
      }
    }
  }
  
  // Si llegamos aquí, todas las combinaciones fallaron
  throw lastError;
}

export const recipeService = {
  async getUserRecipes(username: string): Promise<Recipe[]> {
    try {
      const response = await tryMultipleEndpoints(`/recipes?username=${username}`);
      
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
      // Intentar con la ruta específica para email
      let response;
      try {
        response = await tryMultipleEndpoints(`/recipes/email/${email}`);
      } catch (error) {
        // Si falla, intentar con la ruta genérica
        console.log('Intentando ruta alternativa para email');
        response = await tryMultipleEndpoints(`/recipes/${email}`);
      }
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.recipes)) {
        return response.data.recipes;
      } else if (response.data && response.data.recipes) {
        // Si recipes no es un array pero existe, lo convertimos a array
        return [response.data.recipes];
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
      const response = await tryMultipleEndpoints(`/recipes/patient/${patientId}`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.recipes)) {
        return response.data.recipes;
      } else if (response.data && response.data.recipes) {
        // Si recipes no es un array pero existe, lo convertimos a array
        return [response.data.recipes];
      } else {
        console.warn('Estructura de respuesta inesperada:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener recetas del paciente:', error);
      throw error;
    }
  },
  
  async sendRecipeByEmail(recipeId: string): Promise<any> {
    try {
      const response = await tryMultipleEndpoints(`/recipes/send-email/${recipeId}`, 'post', {});
      return response.data;
    } catch (error) {
      console.error('Error al enviar receta por email:', error);
      throw error;
    }
  },
  
  // Método para probar la conectividad con el backend
  async testConnectivity(): Promise<string> {
    for (const backend of POSSIBLE_BACKENDS) {
      try {
        console.log(`Probando conectividad con: ${backend}`);
        await axios.get(backend, { timeout: 3000 });
        return `Conexión exitosa con ${backend}`;
      } catch (error: any) {
        console.log(`Fallo al conectar con ${backend}: ${error.message}`);
      }
    }
    return 'No se pudo conectar con ningún backend';
  }
}; 