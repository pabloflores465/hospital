import connection from '../app/connection.json';

export const environment = {
  production: false,
  apiUrl: `http://${connection.ip}:${connection.port}`,
};
