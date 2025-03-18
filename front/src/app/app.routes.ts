import { Routes, ActivatedRouteSnapshot } from '@angular/router';
import { AdminUsersSingleComponent } from './admin-users-single/admin-users-single.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { DefaultLayoutComponent } from './default-layout/default-layout.component';
import { LoginComponent } from './login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { SignupComponent } from './signup/signup.component';
import { ValidateUserComponent } from './validate-user/validate-user.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { DoctorsComponent } from './doctors/doctors.component';
import { PrescriptionsComponent } from './prescriptions/prescriptions.component';
import { RecipesPage } from './recipes/recipes-page';
import { authGuard } from './guards/auth.guard';
import { DoctorAgendaComponent } from './doctor-agenda/doctor-agenda.component';
import { PatientHistoryComponent } from './patient-history/patient-history.component';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: '', component: MainPageComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'validate', component: ValidateUserComponent },
      { 
        path: 'admin/users', 
        component: AdminUsersComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] }
      },
      { path: 'admin/users/:id', component: AdminUsersSingleComponent },
      { 
        path: 'appointments', 
        component: AppointmentsComponent,
        canActivate: [authGuard],
        data: { roles: ['patient'] }
      },
      { 
        path: 'admin/doctors', 
        component: DoctorsComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'doctor/prescriptions', 
        component: PrescriptionsComponent,
        canActivate: [authGuard],
        data: { roles: ['doctor'] }
      },
      { path: 'recipes', component: RecipesPage },
      { 
        path: 'doctor/agenda', 
        component: DoctorAgendaComponent,
        canActivate: [authGuard],
        data: { roles: ['doctor'] }
      },
      { 
        path: 'doctor/patient-history', 
        component: PatientHistoryComponent,
        canActivate: [authGuard],
        data: { roles: ['doctor'] }
      },
      { 
        path: 'doctor/dashboard', 
        component: DoctorDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['doctor'] },
        children: [
          { path: 'agenda', component: DoctorAgendaComponent, canActivate: [authGuard], data: { roles: ['doctor'] } },
          { path: 'patient-history', component: PatientHistoryComponent, canActivate: [authGuard], data: { roles: ['doctor'] } },
          { path: '', redirectTo: 'agenda', pathMatch: 'full' }
        ]
      },
    ],
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [() => authGuard(), (route: ActivatedRouteSnapshot) => roleGuard(route)],
    data: { roles: ['admin'] }
  },
  {
    path: 'prescriptions',
    loadComponent: () => import('./prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent),
    canActivate: [() => authGuard(), (route: ActivatedRouteSnapshot) => roleGuard(route)],
    data: { roles: ['doctor'] }
  },
  {
    path: 'prescriptions/new',
    loadComponent: () => import('./prescriptions/add-prescription/add-prescription.component').then(m => m.AddPrescriptionComponent),
    canActivate: [() => authGuard(), (route: ActivatedRouteSnapshot) => roleGuard(route)],
    data: { roles: ['doctor'] }
  }
];
