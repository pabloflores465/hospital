import { Routes } from '@angular/router';
import { AdminUsersSingleComponent } from './admin-users-single/admin-users-single.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { DefaultLayoutComponent } from './default-layout/default-layout.component';
import { LoginComponent } from './login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { SignupComponent } from './signup/signup.component';
import { ValidateUserComponent } from './validate-user/validate-user.component';
import { AppointmentsComponent } from './appointments/appointments.component';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: '', component: MainPageComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'validate', component: ValidateUserComponent },
      { path: 'admin/users', component: AdminUsersComponent },
      { path: 'admin/users/:id', component: AdminUsersSingleComponent },
      { path: 'appointments', component: AppointmentsComponent },
    ],
  }, 
];
