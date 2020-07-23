import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginGuard } from './shared/guards/login/login.guard';
import { SuperadminGuard } from './shared/guards/superadmin/superadmin.guard';
import { AdminGuard } from './shared/guards/admin/admin.guard';
import { UserGuard } from './shared/guards/user/user.guard';

const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full'},
  { path: 'calendar', loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule) },
  { path: 'login', canActivate: [LoginGuard], loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule) },
  { path: 'superadmin', canActivate: [SuperadminGuard],
    loadChildren: () => import('./features/superadmin/superadmin.module').then(m => m.SuperadminModule) },
  { path: 'admin', canActivate: [AdminGuard], loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
