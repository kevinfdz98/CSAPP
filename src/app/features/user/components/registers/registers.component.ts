import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FullCalendarComponent, CalendarOptions } from '@fullcalendar/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { User } from 'src/app/shared/interfaces/user.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registers',
  templateUrl: './registers.component.html',
  styleUrls: ['./registers.component.css']
})
export class RegistersComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;
  private subscriptions = new Subscription();
  private onMobile: boolean;
  private gid: string;
  private user: User;

  public calendarOptions: CalendarOptions = {
    // View configuration and display
    initialView: 'list',
    headerToolbar: { start: '', center: 'title', end: '' },
    footerToolbar: { start: '', center: 'prev next', end: '' },
    height: '100%',
    duration: {months: 1},
    handleWindowResize: true,
    expandRows: true,

    // Handler for clic in an event
    eventClick: (arg) => {
      this.router.navigate(['events', arg.event.id]);
    },

    // Function to fetch events
    events: (info, success, failure) => {
      this.calendarS.getEvents(info.start, info.end)
                    .then(events => success(
                      events.filter(event => this.user.registeredIn.includes(event.eid))
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
    private authS: AuthService,
    private calendarS: CalendarService,
    private snack: MatSnackBar,
    private router: Router,
    private breakpointObserver: BreakpointObserver
) { }

  ngOnInit(): void {
    // Subscribe to changes in screen size to change table columns
    this.subscriptions.add(
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                             })
    );
    // Subscribe to changes in screen size to change table columns
    this.subscriptions.add(
      this.authS.observeUser().subscribe(user => this.user = user)
    );
  }

  private openSnack(message: string, action: string, ms: number): void {
    this.snack.open(message, action, {
      duration: ms,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  openSettingsDialog(): void {
    alert('openSettings()');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
