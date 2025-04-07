import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-admin-users-single',
  imports: [FormsModule, ButtonComponent],
  templateUrl: './admin-users-single.component.html',
  styleUrl: './admin-users-single.component.css',
})
export class AdminUsersSingleComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);
  user = '';
  isNewUser = computed(() => this.route.snapshot.paramMap.get('id') === 'new');
  force_admin = signal(false);
  email = '';
  rol = 'paciente';
  noLicencia = '';
  password = '';
  errorMessage = signal('');

  async loadUser(id: string) {
    const url = await back_url();
    try {
      const response = await fetch(`${url}/obtener_usuario/${id}`, {
        method: 'GET',
      });
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        return;
      }

      this.user = data.username;
      this.force_admin.set(data.force_admin);
      this.email = data.email;
      this.noLicencia = data.noLicencia;
      this.rol = data.rol;
    } catch (error) {
      console.error(error);
    }
  }

  async submitForm() {
    if (!this.email || !this.rol) {
      this.errorMessage.set('Por favor llene correo electrónico');
      return;
    }

    try {
      const url = await back_url();
      const response = await fetch(
        this.isNewUser()
          ? `${url}/insertar_usuario/`
          : `${url}/actualizar_usuario/${this.route.snapshot.paramMap.get(
              'id'
            )}`,
        {
          method: this.isNewUser() ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: this.user,
            email: this.email,
            rol: this.rol,
            noLicencia: this.noLicencia,
            password: this.password,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        return;
      }

      this.router.navigate(['/admin/users']);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al cambiar usuario');
    }
  }

  ngOnInit() {
    if (this.isNewUser()) return;
    this.loadUser(this.route.snapshot.paramMap.get('id')!);
  }
}
