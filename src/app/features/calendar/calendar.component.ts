import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { EventService } from 'src/app/services/event/event.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { FullCalendarComponent } from '@fullcalendar/angular';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, AfterViewInit {

  @ViewChild('calendar') calendarComponent: FullCalendarComponent;
  public calendarOptions: CalendarOptions = {
    // View configuration and display
    headerToolbar: { start: '', center: 'title', end: '' },
    footerToolbar: { start: '', center: 'prev next', end: '' },
    height: '100%',

    // Function to fetch events
    events: (info, success, failure) => {
      this.calendarS.getEvents(info.start, info.end)
                    .then(events => success(events.map(event => ({
                      title: event.title,
                      start: event.timestamp.start as Date,
                      end: event.timestamp.end as Date,
                      backgroundColor: areasList.Tec21[event.areaT21].color,
                      borderColor: areasList.Tec21[event.areaT21].color,
                    }))))
                    .catch(reason => failure(reason));
    }
  };

  constructor(
    private route: ActivatedRoute,
    private calendarS: CalendarService,
    private eventS: EventService,
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.route.paramMap.subscribe(param => {
      const view = param.get('view');
      const calendarApi = this.calendarComponent.getApi();
      switch (view) {
        case 'month':
          calendarApi.changeView('dayGridMonth');
          break;
        case 'week':
          calendarApi.changeView('timeGridWeek');
          break;
        case 'list':
          calendarApi.changeView('listWeek');
          break;
        default:
          console.error('Unknown calendar view: ' + view)
      }
    });
  }

}
