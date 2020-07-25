import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';


@NgModule({
  declarations: [CalendarComponent],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    AngularMaterialModule,
    MyFullCalendarModule
  ]
})
export class CalendarModule { }
