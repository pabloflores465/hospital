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
    if (this.validateSession()) {
      this.redirectBasedOnRole();
    }
  }

  private loadUserFromStorage(): User | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
    return null;
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.userSubject.next(user);
      this.redirectBasedOnRole();
    } else {
      this.logOut();
    }
  }

  logOut(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  validateSession(): boolean {
    const user = this.loadUserFromStorage();
    if (user) {
      this.userSubject.next(user);
      return true;
    }
    return false;
  }

  redirectBasedOnRole(): void {
    const user = this.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.rol) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'patient':
      case 'paciente':
        this.router.navigate(['/patient/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  getRolLabel(rol: string): string {
    switch (rol) {
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

    switch (user.rol) {
      case 'admin':
        return [
          { label: 'Dashboard', route: '/admin/dashboard' },
          { label: 'Doctores', route: '/admin/doctors' },
          { label: 'Pacientes', route: '/admin/patients' },
          { label: 'Citas', route: '/admin/appointments' }
        ];
      case 'doctor':
        return [
          { label: 'Dashboard', route: '/doctor/dashboard' },
          { label: 'Recetas', route: '/prescriptions' },
          { label: 'Nueva Receta', route: '/prescriptions/new' },
          { label: 'Historial de Pacientes', route: '/doctor/patient-history' }
        ];
      case 'patient':
      case 'paciente':
        return [
          { label: 'Mi Historial', route: '/patient/history' },
          { label: 'Mis Citas', route: '/patient/appointments' }
        ];
      default:
        return [];
    }
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }
}
