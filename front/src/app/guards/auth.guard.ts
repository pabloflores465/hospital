import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.getUser()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar roles si la ruta tiene datos de roles requeridos
  if (route.data['roles'] && !route.data['roles'].includes(userService.getUser()?.rol)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
