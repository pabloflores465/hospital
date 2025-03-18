import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from '../services/user.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const user = userService.getUser();
  const requiredRoles = route.data?.['roles'];

  if (!user || !requiredRoles) {
    router.navigate(['/']);
    return false;
  }

  if (!requiredRoles.includes(user.rol)) {
    router.navigate(['/']);
    return false;
  }

  return true;
}; 