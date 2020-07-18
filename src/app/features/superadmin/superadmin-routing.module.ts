import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SuperadminComponent } from './superadmin.component';
import { AdminsListComponent } from './components/admins-list/admins-list.component';
import { GroupsListComponent } from './components/groups-list/groups-list.component';

const routes: Routes = [
  { path: '', component: SuperadminComponent},
  { path: 'admins-list', component: AdminsListComponent},
  { path: 'groups-list', component: GroupsListComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
