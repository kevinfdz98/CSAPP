import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { EventService } from 'src/app/services/event/event.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { majorsList } from 'src/app/shared/interfaces/major.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EditEventFormComponent } from '../edit-event-form/edit-event-form.component';
import { EditEventData } from '../edit-event-form/edit-event-form.component';
import { GroupService } from 'src/app/services/group/group.service';
import { Event } from 'src/app/shared/interfaces/event.interface';
import { FullCalendarComponent } from '@fullcalendar/angular';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('calendar') calendarComponent: FullCalendarComponent;
  private subscriptions = new Subscription();
  private onMobile: boolean;
  private gid: string;

  public calendarOptions: CalendarOptions = {
    // View configuration and display
    initialView: 'list',
    headerToolbar: { start: '', center: 'title', end: '' },
    footerToolbar: { start: '', center: 'prev next', end: '' },
    height: '100%',
    duration: {months: 1},
    handleWindowResize: true,
    expandRows: true,

    // Function to open edit dialog when clic on event
    eventClick: (arg) => {
      this.editEventDialog(arg.event.id);
    },

    // Function to fetch events
    events: (info, success, failure) => {
      this.calendarS.getEvents(info.start, info.end)
                    .then(events => success(
                      events.filter(event => event.organizingGroups.includes(this.gid))
                            .map(event => ({
                              id: event.eid,
                              title: event.title,
                              start: event.timestamp.start as Date,
                              end: event.timestamp.end as Date,
                              borderColor: areasList.Tec21[event.areaT21].color
                            }))
                    )).catch(reason => failure(reason));
    }
  };

  constructor(
    private route: ActivatedRoute,
    private calendarS: CalendarService,
    private eventS: EventService,
    private groupS: GroupService,
    private snack: MatSnackBar,
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
    // Subscribe to changes in route
    this.subscriptions.add(this.route.paramMap.subscribe(param => {
      this.calendarComponent.getApi().refetchEvents();
      this.gid = param.get('gid');
    }));
  }

  addEventDialog(): void {
    this.editEventDialog(null);
  }

  private openSnack(message: string, action: string, ms: number): void {
    this.snack.open(message, action, {
      duration: ms,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  editEventDialog(eid?: string): void {
    this.groupS.getGroup(this.gid).then(async group => {
      const eventData = eid ? (await this.eventS.getEvent(eid, true)) : null;

      const dialogRef = this.dialog.open(EditEventFormComponent, {
        width: this.onMobile ? '100vw' : 'min-content',
        height: this.onMobile ? '100vh' : 'min-content',
        maxWidth: this.onMobile ? '100vw' : '80vw',
        maxHeight: this.onMobile ? '100vh' : '70vh',
        data: {
          eventIn: eid ? eventData : {
            eid: null,
            areaT21: group.majorsTec21[0] ? majorsList.Tec21[group.majorsTec21[0]].area : '',
            organizingGroups: [group.gid]
          },
          eventOut: null
        }
      });

      dialogRef.afterClosed().subscribe(async (data: EditEventData) => {
        // If closed with an action
        if (data) {
          // If event created or updated
          if (data.eventOut) {
            this.openSnack('Cambios guardados', 'Nice!', 1000);
            // Do apropiate action
            if (!data.eventOut.eid) {
              await this.eventS.createEvent(this.gid, {...data.eventOut as Event});
            } else {
              await this.eventS.updateEvent(data.eventOut.eid, {...data.eventOut as Event});
            }
          // If event deleted
          } else {
            this.openSnack('Evento eliminado', 'Ok!', 1000);
            await this.eventS.deleteEvent(eid);
          }
          this.calendarS.refresh();
          this.calendarComponent.getApi().refetchEvents();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
