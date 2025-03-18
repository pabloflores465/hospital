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

      // Simulación de login exitoso - Aquí normalmente iría la llamada al backend
      let mockUser: User;
      
      // Simular diferentes roles basados en el nombre de usuario
      switch (this.username.toLowerCase()) {
        case 'admin':
          mockUser = {
            _id: '1',
            username: 'admin',
            email: 'admin@hospital.com',
            rol: 'admin'
          };
          break;
        case 'doctor':
          mockUser = {
            _id: '2',
            username: 'doctor',
            email: 'doctor@hospital.com',
            rol: 'doctor',
            noLicencia: 'MED-123'
          };
          break;
        case 'paciente':
          mockUser = {
            _id: '3',
            username: 'paciente',
            email: 'paciente@hospital.com',
            rol: 'paciente'
          };
          break;
        default:
          throw new Error('Usuario no encontrado');
      }

      // Validar la contraseña (simulado)
      if (this.password !== '123456') {
        throw new Error('Contraseña incorrecta');
      }

      console.log('Usuario autenticado:', mockUser);
      
      // Guardar el usuario en el servicio
      this.userService.setUser(mockUser);
      
      // La redirección se maneja en el servicio
    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage.set(error.message || 'Error al iniciar sesión');
      this.userService.logOut(); // Limpiar cualquier dato residual
    } finally {
      this.loading.set(false);
    }
  }
}
