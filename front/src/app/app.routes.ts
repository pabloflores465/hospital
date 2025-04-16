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
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { roleGuard } from './guards/role.guard';
import { AddPrescriptionComponent } from './prescriptions/add-prescription/add-prescription.component';
import { DoctorList } from './doctor_list/doctor_list';
import { MisRecetasComponent } from './dashboard/mis-recetas/mis-recetas.component';
import { UserRecipesComponent } from './patient-dashboard/user-recipes/user-recipes.component';
import { Comments } from './comments/comments';
import { ImportServicesPage } from './import-services/import-services';
import { PatientServicesComponent } from './patient/patient-services';
import { MedicalRecordComponent } from './medical-record/medical-record.component';
import { PatientSelectorComponent } from './medical-record/patient-selector.component';
import { FaqComponent } from './faq/faq';
import { HospitalHistoryComponent } from './history/history';
import { HospitalContactComponent } from './contact/contact';
import { HospitalMisionComponent } from './mission/mission';
import { HospitalVisionComponent } from './vision/vision';
import { AuditComponent } from './audit/audit';
import { ModerationComponent } from './moderation/moderation';
import { DoctorReportsComponent } from './doctor-reports/doctor-reports.component';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: 'moderation', component: ModerationComponent },
      { path: 'audit', component: AuditComponent },
      { path: 'mission', component: HospitalMisionComponent },
      { path: 'vision', component: HospitalVisionComponent },
      { path: 'history', component: HospitalHistoryComponent },
      { path: 'contact', component: HospitalContactComponent },
      { path: 'faq', component: FaqComponent },
      { path: 'import-services', component: ImportServicesPage },
      { path: 'patient-services', component: PatientServicesComponent },
      { path: 'doctor-list', component: DoctorList },
      { path: 'comments', component: Comments },
      { path: '', component: MainPageComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'validate', component: ValidateUserComponent },
      { path: 'doctor-reports', redirectTo: 'doctor/doctor-reports', pathMatch: 'full' },
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      { path: 'admin/users/:id', component: AdminUsersSingleComponent },
      {
        path: 'appointments',
        component: AppointmentsComponent,
        canActivate: [authGuard],
        data: { roles: ['patient', 'doctor'] },
      },
      {
        path: 'admin/doctors',
        component: DoctorsComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'doctor',
        canActivate: [authGuard],
        data: { roles: ['doctor'] },
        children: [
          {
            path: 'dashboard',
            component: DoctorDashboardComponent,
            children: [
              { path: '', redirectTo: 'agenda', pathMatch: 'full' },
              { path: 'agenda', component: DoctorAgendaComponent },
              { path: 'patient-history', component: PatientHistoryComponent },
            ],
          },
          { path: 'agenda', component: DoctorAgendaComponent },
          { path: 'patient-history', component: PatientHistoryComponent },
          { path: 'prescriptions', component: PrescriptionsComponent },
          { path: 'prescriptions/new', component: AddPrescriptionComponent },
          { path: 'recipes', component: RecipesPage },
          { path: 'doctor-reports', component: DoctorReportsComponent },
        ],
      },
      {
        path: 'patient',
        canActivate: [authGuard],
        data: { roles: ['patient', 'paciente'] },
        children: [
          {
            path: 'dashboard',
            component: PatientDashboardComponent,
            children: [
              { path: '', redirectTo: 'appointments', pathMatch: 'full' },
              { path: 'appointments', component: AppointmentsComponent },
              { path: 'history', component: PatientHistoryComponent },
              { path: 'recipes', component: UserRecipesComponent },
              { path: 'medical-record', component: MedicalRecordComponent },
            ],
          },
          { path: 'appointments', component: AppointmentsComponent },
          { path: 'history', component: PatientHistoryComponent },
          { path: 'recipes', component: UserRecipesComponent },
          { path: 'medical-record', component: MedicalRecordComponent },
        ],
      },
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        canActivate: [authGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'dashboard/mis-recetas',
        component: MisRecetasComponent,
        title: 'Mis Recetas Médicas',
      },
      {
        path: 'medical-record/patients',
        component: PatientSelectorComponent,
        canActivate: [authGuard],
        data: { roles: ['doctor', 'admin'] },
      },
      {
        path: 'medical-record/:patientId',
        component: MedicalRecordComponent,
        canActivate: [authGuard],
        data: { roles: ['patient', 'paciente', 'doctor', 'admin'] },
      },
      {
        path: 'medical-record',
        component: MedicalRecordComponent,
        canActivate: [authGuard],
        data: { roles: ['patient', 'paciente', 'doctor', 'admin'] },
      },
    ],
  },
];
