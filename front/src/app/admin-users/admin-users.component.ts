import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-admin-users',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent {
  users = signal<any[]>([]);
  errorMessage = signal('');

  async loadUsers() {
    const url = await back_url();
    try {
      const response = await fetch(`${url}/lista_usuarios/`, {
        method: 'GET',
      });
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        return;
      }

      this.users.set(data);
    } catch (error) {
      console.error(error);
    }
  }

  async borrarUsuario(id: string) {
    const url = await back_url();
    try {
      const response = await fetch(`${url}/borrar_usuario/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        return;
      }
    } catch (error) {
      console.error(error);
    } finally {
      await this.loadUsers();
    }
  }

  ngOnInit() {
    this.loadUsers();
  }
}
