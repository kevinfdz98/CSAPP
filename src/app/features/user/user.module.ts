import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';
import { UserComponent } from './user.component';
import { FavoriteComponent } from './components/favorite/favorite.component';
import { FollowingComponent } from './components/following/following.component';
import { RegistersComponent } from './components/registers/registers.component';


@NgModule({
  declarations: [UserComponent, FavoriteComponent, FollowingComponent, RegistersComponent],
  imports: [
    CommonModule,
    UserRoutingModule,
    AngularMaterialModule,
    MyFullCalendarModule,
  ]
})
export class UserModule { }
