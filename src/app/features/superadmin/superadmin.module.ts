import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminComponent } from './superadmin.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminsListComponent } from './components/admins-list/admins-list.component';
import { GroupsListComponent } from './components/groups-list/groups-list.component';


@NgModule({
  declarations: [SuperadminComponent, AdminsListComponent, GroupsListComponent],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ]
})
export class SuperadminModule { }
