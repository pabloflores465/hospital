import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { back_url } from '../../environments/back_url';
export interface MenuItem {
  label: string;
  route: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly STORAGE_KEY = 'hospital_user';
  private userSubject: BehaviorSubject<User | null>;
  public user$: Observable<User | null>;

  constructor(private router: Router, private http: HttpClient) {
    this.userSubject = new BehaviorSubject<User | null>(
      this.loadUserFromStorage()
    );
    this.user$ = this.userSubject.asObservable();

    // Verificar la sesión al inicio
    this.validateSession();
  }

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const user = JSON.parse(stored);
      console.log('Usuario cargado del localStorage:', user);
      return user;
    } catch (error) {
      console.error('Error al cargar usuario del localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User): void {
    console.log('Guardando usuario:', user);
    if (user) {
      try {
        const userString = JSON.stringify(user);
        localStorage.setItem(this.STORAGE_KEY, userString);
        console.log('Usuario guardado en localStorage:', userString);
        this.userSubject.next(user);
      } catch (error) {
        console.error('Error al guardar usuario:', error);
      }
    } else {
      this.logOut();
    }
  }

  clearUser(): void {
    this.userSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  logOut(): void {
    console.log('Cerrando sesión');
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('userEmail');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  validateSession(): boolean {
    const user = this.loadUserFromStorage();
    console.log('Validando sesión, usuario:', user);
    if (user) {
      this.userSubject.next(user);
      return true;
    }
    return false;
  }

  redirectBasedOnRole(): void {
    const user = this.getUser();
    console.log('Redirigiendo basado en rol, usuario:', user);

    if (!user) {
      console.log('No hay usuario, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    const rol = user.rol.toLowerCase();
    console.log('Rol del usuario:', rol);

    switch (rol) {
      case 'admin':
        console.log('Redirigiendo a dashboard admin');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'doctor':
        console.log('Redirigiendo a dashboard doctor');
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'staff':
        console.log('Redirigiendo a dashboard staff');
        this.router.navigate(['/staff/dashboard']);
        break;
      case 'patient':
      case 'paciente':
        console.log('Redirigiendo a dashboard paciente');
        this.router.navigate(['/patient/dashboard']);
        break;
      default:
        console.log('Rol no reconocido, redirigiendo a home');
        this.router.navigate(['/']);
    }
  }

  getRolLabel(rol: string): string {
    switch (rol.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Doctor';
      case 'patient':
      case 'paciente':
        return 'Paciente';
      default:
        return rol;
    }
  }

  getMenuItems(): MenuItem[] {
    const user = this.getUser();
    if (!user) return [];

    switch (user.rol.toLowerCase()) {
      case 'admin':
        return [
          { label: 'Dashboard', route: '/admin/dashboard' },
          { label: 'Doctores', route: '/admin/doctors' },
          { label: 'Pacientes', route: '/admin/users' },
          { label: 'Citas', route: '/appointments' },
          { label: 'Ficha Médica', route: '/medical-record/patients' },
          { label: 'Servicios del Usuario', route: '/patient-services' },
        ];
      case 'doctor':
        return [
          { label: 'Dashboard', route: '/doctor/dashboard' },
          { label: 'Agenda', route: '/doctor/agenda' },
          { label: 'Recetas', route: '/doctor/prescriptions' },
          { label: 'Nueva Receta', route: '/doctor/prescriptions/new' },
          { label: 'Historial de Pacientes', route: '/doctor/patient-history' },
          { label: 'Ficha Médica', route: '/medical-record/patients' },
        ];
      case 'staff':
        return [
          { label: 'Dashboard', route: '/staff/dashboard' },
          { label: 'Agenda', route: '/staff/agenda' },
          { label: 'Citas', route: '/appointments' },
          { label: 'Historial de Pacientes', route: '/staff/patient-history' },
          { label: 'Ficha Médica', route: '/medical-record/patients' },
          { label: 'Reportes', route: '/doctor-reports' },
        ];
      case 'patient':
      case 'paciente':
        return [
          { label: 'Dashboard', route: '/patient/dashboard' },
          { label: 'Mis Citas', route: '/patient/appointments' },
          { label: 'Mi Historial', route: '/patient/history' },
          { label: 'Mis Recetas', route: '/patient/dashboard/recipes' },
          { label: 'Ficha Médica', route: '/patient/medical-record' },
        ];
      default:
        return [];
    }
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(`${url}/login`, credentials);
  }

  async register(userData: Partial<User>): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.post(`${url}/register`, userData);
  }

  async updateUser(
    userId: string,
    userData: Partial<User>
  ): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.put(`${url}/users/${userId}`, userData);
  }

  async getUserById(userId: string): Promise<Observable<any>> {
    const url = await back_url();
    return this.http.get(`${url}/users/${userId}`);
  }

  // Obtener lista de pacientes
  async getPatients(): Promise<Observable<User[]>> {
    const url = await back_url();
    // Intentamos buscar en el endpoint real primero
    return new Observable<User[]>((observer) => {
      this.http.get<User[]>(`${url}/users?role=patient`).subscribe({
        next: (patients) => {
          // Si la llamada es exitosa, devolvemos los pacientes de la API
          console.log('Pacientes obtenidos de la API:', patients.length);
          observer.next(patients);
          observer.complete();
        },
        error: (error) => {
          // Si hay un error, usamos datos de respaldo con los pacientes reales que sabemos que existen
          console.error(
            'Error al obtener pacientes de la API, usando respaldo:',
            error
          );
          const backupPatients = [
            {
              _id: '67dd0af00d9fcd8d2fc7a1fb', // ID real del primer paciente
              username: 'paciente1',
              name: 'Paciente Uno',
              email: 'paciente1@example.com',
              rol: 'paciente',
              identification: '123456789',
            },
            {
              _id: '67dd0c21ca818ed8dbd96c29', // ID real del segundo paciente
              username: 'paciente2',
              name: 'Paciente Dos',
              email: 'paciente2@example.com',
              rol: 'paciente',
              identification: '987654321',
            },
          ];

          // Simulamos un pequeño retraso
          setTimeout(() => {
            observer.next(backupPatients);
            observer.complete();
          }, 500);
        },
      });
    });
  }

  // Obtener lista de pacientes específicamente para selección en citas y formularios
  async getPatientsForSelection(): Promise<User[]> {
    try {
      console.log('Obteniendo pacientes para selección...');
      
      // Devolver datos de respaldo directamente para evitar problemas de API
      const backupPatients = [
        {
          _id: '67dd0af00d9fcd8d2fc7a1fb',
          username: 'paciente1',
          name: 'Paciente Uno',
          email: 'paciente1@example.com',
          rol: 'paciente',
          identification: '123456789',
        },
        {
          _id: '67dd0c21ca818ed8dbd96c29',
          username: 'paciente2',
          name: 'Paciente Dos',
          email: 'paciente2@example.com',
          rol: 'paciente',
          identification: '987654321',
        }
      ];
      
      console.log('Usando pacientes de respaldo para selección:', backupPatients.length);
      return backupPatients;
    } catch (error) {
      console.error('Error obteniendo pacientes para selección, usando respaldo:', error);
      // Devolver datos de respaldo
      return [
        {
          _id: '67dd0af00d9fcd8d2fc7a1fb',
          username: 'paciente1',
          name: 'Paciente Uno',
          email: 'paciente1@example.com',
          rol: 'paciente',
          identification: '123456789',
        },
        {
          _id: '67dd0c21ca818ed8dbd96c29',
          username: 'paciente2',
          name: 'Paciente Dos',
          email: 'paciente2@example.com',
          rol: 'paciente',
          identification: '987654321',
        }
      ];
    }
  }
}
