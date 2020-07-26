import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { EventService } from 'src/app/services/event/event.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscriptions = new Subscription();
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;
  public calendarOptions: CalendarOptions = {
    // View configuration and display
    headerToolbar: { start: '', center: 'title', end: ''},
    footerToolbar: { start: '', center: 'prev next', end: '' },
    height: '100%',
    nowIndicator: true,
    handleWindowResize: true,
    expandRows: true,

    customButtons: {
      backToMonth: {
        text: 'Month',
        click: () => {
          const api = this.calendarComponent.getApi();
          api.changeView('dayGridMonth');
          api.setOption('headerToolbar', { start: '', center: 'title', end: '' });
        }
      },
      backToWeek: {
        text: 'Week',
        click: () => {
          const api = this.calendarComponent.getApi();
          api.changeView('timeGridWeek');
          api.setOption('headerToolbar', { start: '', center: 'title', end: '' });
        }
      }
    },

    // Handler for clic on day
    dateClick: (arg) => {
      const api = this.calendarComponent.getApi();
      const view = this.route.snapshot.paramMap.get('view');
      const btn = (view === 'month') ? 'backToMonth' :
                  (view ===  'week') ? 'backToWeek'  : 'backToMonth';
      api.changeView('timeGridDay', arg.dateStr);
      api.setOption('headerToolbar', { start: '', center: 'title', end: btn });
    },

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
    // Subscribe to paramMap
    this.subscriptions.add(
      this.route.paramMap.subscribe(param => {
        const view = param.get('view');
        const api = this.calendarComponent.getApi();
        api.changeView((view === 'month') ? 'dayGridMonth' :
                       (view ===  'week') ? 'timeGridWeek' :
                       (view ===  'list') ? 'listWeek'     :
                                            'dayGridMonth');
      })
    );
    // Subscribe to filter
    this.subscriptions.add(
      this.calendarS.filterObservable.subscribe(filter => {
        const api = this.calendarComponent.getApi();
        api.refetchEvents();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
