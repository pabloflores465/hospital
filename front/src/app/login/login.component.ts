import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { CommonModule } from '@angular/common';
import { back_url } from '../../environments/back_url';

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
  username = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  async onSubmit() {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      if (!this.username || !this.password) {
        throw new Error('Por favor ingrese usuario y contraseña');
      }
      const url = await back_url();
      const response = await fetch(`${url}/login_usuario/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      if (!data.user) {
        throw new Error('Datos de usuario no válidos');
      }

      console.log('Respuesta del servidor:', data);

      // Transformar la respuesta del backend al formato User
      const user: User = {
        _id: data.user._id,
        name: data.user.username,
        username: data.user.username,
        email: data.user.email,
        rol: data.user.rol.toLowerCase(),
        license: data.user.noLicencia || undefined,
      };

      console.log('Usuario autenticado:', user);

      // Guardar el usuario en el servicio
      this.userService.setUser(user);
      
      // Guardar el email del usuario en localStorage para usarlo más tarde
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }

      // Redireccionar según el rol del usuario
      this.userService.redirectBasedOnRole();
    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage.set(error.message || 'Error al iniciar sesión');
      this.userService.logOut(); // Limpiar cualquier dato residual
    } finally {
      this.loading.set(false);
    }
  }
}
