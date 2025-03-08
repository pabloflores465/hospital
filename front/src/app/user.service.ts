import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userData = signal<any>(null);

  constructor() {}

  user() {
    return this.userData();
  }

  setUser(data: any) {
    this.userData.set(data);
  }
}
