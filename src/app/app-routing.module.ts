import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full'},
  { path: 'calendar', loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule) },
  { path: 'login', loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
