import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { back_url } from '../../environments/back_url';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users-single',
  imports: [FormsModule, ButtonComponent, CommonModule],
  templateUrl: './admin-users-single.component.html',
  styleUrl: './admin-users-single.component.css',
})
export class AdminUsersSingleComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);
  user: any = { username: '', activated: false };
  isNewUser = computed(() => this.route.snapshot.paramMap.get('id') === 'new');
  force_admin = signal(false);
  email = '';
  rol = 'paciente';
  noLicencia = '';
  password = '';
  activated = false;
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

      this.user = data;
      this.force_admin.set(data.force_admin || false);
      this.email = data.email || '';
      this.noLicencia = data.noLicencia || '';
      this.rol = data.rol || 'pendiente';
      this.activated = data.activated || false;
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al cargar datos del usuario');
    }
  }

  async submitForm() {
    if (!this.email || !this.rol) {
      this.errorMessage.set('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const url = await back_url();
      
      const userData = {
        username: this.isNewUser() ? this.user : this.user.username,
        email: this.email,
        rol: this.rol,
        noLicencia: this.rol === 'doctor' ? this.noLicencia : '',
        password: this.password,
        activated: this.activated
      };
      
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
          body: JSON.stringify(userData),
        }
      );
      
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje || 'Error al procesar la solicitud');
        return;
      }

      alert('Usuario guardado correctamente');
      this.router.navigate(['/admin/users']);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al guardar el usuario');
    }
  }

  ngOnInit() {
    if (this.isNewUser()) return;
    this.loadUser(this.route.snapshot.paramMap.get('id')!);
  }
}
