import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, MenuItem } from '../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  private userSubscription?: Subscription;

  constructor(public userService: UserService) {}

  ngOnInit() {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.userService.user$.subscribe(() => {
      this.updateMenuItems();
    });

    // Inicializar los elementos del menú
    this.updateMenuItems();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private updateMenuItems() {
    this.menuItems = this.userService.getMenuItems();
  }
}
