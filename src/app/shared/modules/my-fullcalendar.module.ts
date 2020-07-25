import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  dayGridPlugin,
  listPlugin,
  timeGridPlugin
]);

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FullCalendarModule
  ],
  exports: [
    FullCalendarModule
  ]
})
export class MyFullCalendarModule { }
