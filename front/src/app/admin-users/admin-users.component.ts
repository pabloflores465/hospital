import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { back_url } from '../../environments/back_url';

@Component({
  selector: 'app-admin-users',
  imports: [RouterLink, ButtonComponent, CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent {
  users = signal<any[]>([]);
  errorMessage = signal('');
  searchTerm = '';
  filterRole = 'all';
  filterStatus = 'all';

  filteredUsers = computed(() => {
    return this.users().filter(user => {
      // Filtrar por estado
      if (this.filterStatus === 'pending' && user.activated) return false;
      if (this.filterStatus === 'active' && !user.activated) return false;
      
      // Filtrar por rol
      if (this.filterRole !== 'all' && user.rol !== this.filterRole) return false;
      
      // Filtrar por término de búsqueda
      if (this.searchTerm && !user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) && 
          !user.username.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  });

  applyFilters() {
    // La actualización se hace automáticamente gracias al computed
  }

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
      this.errorMessage.set('Error al cargar usuarios');
    }
  }

  async activateUser(userId: string) {
    const url = await back_url();
    try {
      const response = await fetch(`${url}/activar_usuario/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje || 'Error al activar usuario');
        return;
      }

      alert('Usuario activado correctamente. Se ha enviado un correo de notificación.');
      await this.loadUsers();
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al activar usuario');
    }
  }

  async borrarUsuario(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }
    
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
      
      alert('Usuario eliminado correctamente');
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al eliminar usuario');
    } finally {
      await this.loadUsers();
    }
  }

  ngOnInit() {
    this.loadUsers();
  }
}
