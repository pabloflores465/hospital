export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000', // URL principal para las peticiones
  allowedUrls: [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://172.16.56.93:8000', // URL con la IP específica
  ],
};
