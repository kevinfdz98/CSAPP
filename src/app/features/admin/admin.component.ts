import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { EventService } from 'src/app/services/event/event.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { EventTypes } from 'src/app/shared/enums/event-types.enum';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  private gid: string;

  public calendarOptions: CalendarOptions = {
    // View configuration and display
    initialView: 'list',
    headerToolbar: { start: '', center: 'title', end: '' },
    footerToolbar: { start: '', center: 'prev next', end: '' },
    height: '100%',
    duration: {months: 1},

    // Function to fetch events
    events: (info, success, failure) => {
      this.calendarS.getEvents(info.start, info.end)
                    .then(events => success(events.map(event => ({
                      title: event.title,
                      start: event.timestamp.start as Date,
                      end: event.timestamp.end as Date,
                      borderColor: areasList.Tec20[event.area.Tec20].color
                    }))))
                    .catch(reason => failure(reason));
    }
  };

  constructor(
    private route: ActivatedRoute,
    private calendarS: CalendarService,
    private eventS: EventService,
) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(param => {
      this.gid = param.get('gid');
    });
  }

  addEventDialog(): void {
    alert('I will add an event');
    const n = Math.floor(Math.random() * 31);
    this.eventS.createEvent(this.gid, {
      eid: null,
      title: '',
      type: EventTypes.Conferencia,
      area: {Tec20: 'TIE', Tec21: 'ICT'},
      organizingGroups: [this.gid],
      timestamp: {
        start: new Date(2020, 7, n, 15, 0, 0),
        end: new Date(2020, 7, n, 16, 30, 0)
      },
      place: '',
      description: '',
      linkRegister: '',
      linkEvent: '',
      imgUrl: '',
      followers: [],
    })
  }

}
