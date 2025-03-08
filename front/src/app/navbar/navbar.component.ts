import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { UserService } from '../user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  adminRoutes: any[] = [];

  constructor(public userService: UserService, private router: Router) { }

  ngOnInit(): void {
    // Obtener rutas de administración: Se asume que las rutas admin están definidas dentro de una ruta raíz con children.
    const mainRoute = this.router.config.find(route => route.path === '' && route.children);
    if (mainRoute && mainRoute.children) {
      this.adminRoutes = mainRoute.children.filter(child => child.path && child.path.startsWith('admin'));
    }
  }

  logOut() {
    this.userService.setUser(null);
    this.router.navigate(['/']);
  }
}
