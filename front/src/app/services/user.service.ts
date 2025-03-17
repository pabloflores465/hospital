import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  rol: 'admin' | 'doctor' | 'patient';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'hospital_user';
  private currentUser: User | null = this.loadUserFromStorage();

  constructor(private router: Router) {
    console.log('Usuario al iniciar:', this.currentUser);
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
    return this.currentUser;
  }

  setUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  logOut(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  validateSession(): boolean {
    const user = this.loadUserFromStorage();
    return !!user;
  }

  getRolLabel(rol: string): string {
    const roles = {
      'admin': 'Administrador',
      'doctor': 'Doctor',
      'patient': 'Paciente'
    };
    return roles[rol as keyof typeof roles] || rol;
  }
}
