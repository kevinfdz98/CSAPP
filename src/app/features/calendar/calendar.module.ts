import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';
import { FilterDialogComponent } from './components/filter-dialog/filter-dialog.component';


@NgModule({
  declarations: [CalendarComponent, FilterDialogComponent],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    AngularMaterialModule,
    MyFullCalendarModule
  ]
})
export class CalendarModule { }
