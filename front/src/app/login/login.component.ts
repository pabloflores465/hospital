import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { UserService, User } from '../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  user = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  async submitForm() {
    if (this.loading()) return;
    
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      // Simulación de login exitoso
      const mockUser: User = {
        _id: '1',
        username: 'doctor',
        email: 'doctor@example.com',
        rol: 'doctor'
      };

      this.userService.setUser(mockUser);
      this.userService.redirectBasedOnRole();
    } catch (error) {
      console.error('Error en login:', error);
      this.errorMessage.set('Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    try {
      const mockUser: User = {
        _id: '1',
        username: this.user,
        email: `${this.user}@example.com`,
        rol: 'admin'
      };

      this.userService.setUser(mockUser);
      this.userService.redirectBasedOnRole();
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
