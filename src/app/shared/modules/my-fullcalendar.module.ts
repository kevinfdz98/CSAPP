import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  dayGridPlugin,
  listPlugin,
  timeGridPlugin,
  interactionPlugin
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
