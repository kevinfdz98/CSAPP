import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginGuard } from './shared/guards/login/login.guard';
import { SuperadminGuard } from './shared/guards/superadmin/superadmin.guard';
import { AdminGuard } from './shared/guards/admin/admin.guard';
import { UserGuard } from './shared/guards/user/user.guard';
import { InfoPageComponent } from './components/info-page/info-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full'},
  { path: 'calendar', loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule) },
  { path: 'login', canActivate: [LoginGuard], loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule) },
  { path: 'superadmin', canActivate: [SuperadminGuard],
    loadChildren: () => import('./features/superadmin/superadmin.module').then(m => m.SuperadminModule) },
  { path: 'admin', canActivate: [AdminGuard], loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
  { path: 'events', loadChildren: () => import('./features/events/events.module').then(m => m.EventsModule) },
  { path: 'user', loadChildren: () => import('./features/user/user.module').then(m => m.UserModule) },
  { path: 'groups', loadChildren: () => import('./features/groups/groups.module').then(m => m.GroupsModule) },
  { path: 'info', component: InfoPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
