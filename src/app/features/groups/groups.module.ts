import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { GroupsRoutingModule } from './groups-routing.module';
import { GroupsComponent } from './groups.component';


@NgModule({
  declarations: [GroupsComponent],
  imports: [
    CommonModule,
    GroupsRoutingModule,
    AngularMaterialModule
  ]
})
export class GroupsModule { }
