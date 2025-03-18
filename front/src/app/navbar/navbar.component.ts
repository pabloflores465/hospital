import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, MenuItem } from '../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  menuItems: MenuItem[] = [];

  constructor(public userService: UserService) {}

  ngOnInit() {
    this.menuItems = this.userService.getMenuItems();
  }

  onUserChange() {
    this.menuItems = this.userService.getMenuItems();
  }
}
