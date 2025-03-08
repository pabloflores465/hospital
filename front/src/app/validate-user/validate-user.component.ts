import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-validate-user',
  imports: [],
  templateUrl: './validate-user.component.html',
  styleUrl: './validate-user.component.css',
})
export class ValidateUserComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);

  errorMessage = signal('');

  async validate() {
    try {
      const response = await fetch(`http://127.0.0.1:8000/validar_usuario/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.route.snapshot.queryParamMap.get('username'),
          validation_code: this.route.snapshot.queryParamMap.get('code'),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        this.errorMessage.set(data.mensaje);
        return;
      }

      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al validar el usuario');
    }
  }

  ngOnInit() {
    this.validate();
  }
}
