import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  router = inject(Router);
  userService = inject(UserService);
  user = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  async submitForm() {
    if (!this.user || !this.password) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    this.loading.set(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/login_usuario/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.user,
          password: this.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        this.loading.set(false);
        return;
      }

      this.userService.setUser(data.user);
      this.loading.set(false);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al iniciar sesión');
      this.loading.set(false);
    }
  }

  async onSubmit() {
    try {
      // Simular una respuesta del backend
      const mockUser = {
        id: 1,
        username: this.user,
        email: `${this.user}@example.com`,
        rol: 'admin' // Esto vendría del backend
      };

      // Guardar el usuario en el servicio (esto persistirá en localStorage)
      this.userService.setUser(mockUser);
      
      // Redirigir según el rol
      if (mockUser.rol === 'admin') {
        this.router.navigate(['/admin/users']);
      } else if (mockUser.rol === 'doctor') {
        this.router.navigate(['/doctor/prescriptions']);
      } else {
        this.router.navigate(['/appointments']);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
