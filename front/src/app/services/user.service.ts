import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  _id: string;
  username: string;
  email: string;
  rol: string;
  validated?: boolean;
  noLicencia?: string;
}

export interface MenuItem {
  label: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'hospital_user';
  private userSubject: BehaviorSubject<User | null>;
  public user$: Observable<User | null>;

  constructor(private router: Router) {
    this.userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
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
    const user = this.userSubject.value;
    console.log('getUser retornando:', user);
    return user;
  }

  setUser(user: User | null): void {
    console.log('Guardando usuario:', user);
    if (user) {
      try {
        const userString = JSON.stringify(user);
        localStorage.setItem(this.STORAGE_KEY, userString);
        console.log('Usuario guardado en localStorage:', userString);
        this.userSubject.next(user);
        this.redirectBasedOnRole();
      } catch (error) {
        console.error('Error al guardar usuario:', error);
      }
    } else {
      this.logOut();
    }
  }

  logOut(): void {
    console.log('Cerrando sesión');
    localStorage.removeItem(this.STORAGE_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const isLogged = this.getUser() !== null;
    console.log('isLoggedIn:', isLogged);
    return isLogged;
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
          { label: 'Citas', route: '/appointments' }
        ];
      case 'doctor':
        return [
          { label: 'Dashboard', route: '/doctor/dashboard' },
          { label: 'Agenda', route: '/doctor/agenda' },
          { label: 'Recetas', route: '/doctor/prescriptions' },
          { label: 'Nueva Receta', route: '/doctor/prescriptions/new' },
          { label: 'Historial de Pacientes', route: '/doctor/patient-history' }
        ];
      case 'patient':
      case 'paciente':
        return [
          { label: 'Dashboard', route: '/patient/dashboard' },
          { label: 'Mis Citas', route: '/patient/appointments' },
          { label: 'Mi Historial', route: '/patient/history' },
          { label: 'Mis Recetas', route: '/patient/prescriptions' }
        ];
      default:
        return [];
    }
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }
}
