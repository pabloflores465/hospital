import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { SwitchComponent } from '../switch/switch.component';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, ButtonComponent, SwitchComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  router = inject(Router);

  user = '';
  email = '';
  password = '';
  confirmPassword = '';
  doctorCheck = signal(false);
  noLicencia = '';
  errorMessage = signal('');
  loading = signal(false);

  async submitForm() {
    if (!this.user || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    try {
      const url = await back_url();
      const response = await fetch(`${url}/registrar_usuario/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.user,
          email: this.email,
          password: this.password,
          rol: this.doctorCheck() ? 'doctor' : 'paciente',
          noLicencia: this.doctorCheck() ? this.noLicencia : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Error en el registro');
      }

      alert('Registro exitoso. Revisa tu correo para confirmar tu cuenta.');

      // 🔹 Redirigir a la página de login después de registrarse
      this.router.navigate(['/login']);
      this.loading.set(false);
    } catch (error) {
      this.errorMessage.set('Error al registrar usuario');
      this.loading.set(false);
    }
  }
}
