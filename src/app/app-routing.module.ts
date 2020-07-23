import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full'},
  { path: 'calendar', loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule) },
  { path: 'login', loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule) },
  { path: 'superadmin', loadChildren: () => import('./features/superadmin/superadmin.module').then(m => m.SuperadminModule) },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
