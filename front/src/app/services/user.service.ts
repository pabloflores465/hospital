import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  rol: string;
  validated?: boolean;
  noLicencia?: string;
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
      this.redirectBasedOnRole(this.userSubject.value!);
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
      this.redirectBasedOnRole(user);
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

  private redirectBasedOnRole(user: User): void {
    switch (user.rol) {
      case 'admin':
        this.router.navigate(['/admin/users']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'patient':
      case 'paciente':
        this.router.navigate(['/appointments']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  getRolLabel(rol: string): string {
    const roles = {
      'admin': 'Administrador',
      'doctor': 'Doctor',
      'patient': 'Paciente',
      'paciente': 'Paciente'
    };
    return roles[rol as keyof typeof roles] || rol;
  }

  getMenuItems(): { path: string, label: string }[] {
    const user = this.getUser();
    if (!user) return [];

    switch (user.rol) {
      case 'admin':
        return [
          { path: '/admin/users', label: 'Usuarios' },
          { path: '/admin/doctors', label: 'Doctores' }
        ];
      case 'doctor':
        return [
          { path: '/doctor/dashboard', label: 'Dashboard' },
          { path: '/doctor/prescriptions', label: 'Recetas' },
          { path: '/doctor/agenda', label: 'Agenda' },
          { path: '/doctor/patient-history', label: 'Historial de Pacientes' }
        ];
      case 'patient':
      case 'paciente':
        return [
          { path: '/appointments', label: 'Mis Citas' },
          { path: '/recipes', label: 'Mis Recetas' }
        ];
      default:
        return [];
    }
  }
}
