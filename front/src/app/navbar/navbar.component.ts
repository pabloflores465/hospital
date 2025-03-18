import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ButtonComponent, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  menuItems: { path: string; label: string }[] = [];

  constructor(public userService: UserService, private router: Router) {
    this.userService.user$.subscribe(() => {
      this.menuItems = this.userService.getMenuItems();
    });
  }

  ngOnInit(): void {
    this.menuItems = this.userService.getMenuItems();
  }

  logOut() {
    this.userService.logOut();
  }
}
