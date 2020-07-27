import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';
import { UserComponent } from './user.component';
import { FollowingComponent } from './components/following/following.component';


@NgModule({
  declarations: [UserComponent, FollowingComponent],
  imports: [
    CommonModule,
    UserRoutingModule,
    AngularMaterialModule,
    MyFullCalendarModule,
  ]
})
export class UserModule { }
