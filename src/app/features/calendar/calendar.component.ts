import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { EventService } from 'src/app/services/event/event.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FilterDialogComponent } from './components/filter-dialog/filter-dialog.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscriptions = new Subscription();
  private onMobile = false;
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

    // Handler for clic in an event
    eventClick: (arg) => {
      this.router.navigate(['events', arg.event.id]);
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
                      id: event.eid,
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
    private router: Router,
    private calendarS: CalendarService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // Subscribe to changes in screen size to change table columns
    this.subscriptions.add(
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                             })
    );
  }

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
      this.calendarS.filter.subscribe(filter => {
        const api = this.calendarComponent.getApi();
        api.refetchEvents();
      })
    );
  }

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: this.onMobile ? '100vw' : 'min-content',
      height: this.onMobile ? '100vh' : 'min-content',
      maxWidth: this.onMobile ? '100vw' : '80vw',
      maxHeight: this.onMobile ? '100vh' : '70vh'
    });

    // Refetch events after filter is closed
    dialogRef.afterClosed().subscribe(() =>
      this.calendarComponent.getApi().refetchEvents()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
