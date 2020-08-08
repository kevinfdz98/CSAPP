import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventService } from 'src/app/services/event/event.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Event } from 'src/app/shared/interfaces/event.interface';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take, map } from 'rxjs/operators';
import { Location } from '@angular/common';
import {AngularFireStorage} from '@angular/fire/storage';
import { areasList } from 'src/app/shared/interfaces/area.interface';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  private eid: string;
  public event: Event;
  public following: boolean;
  public areaColor = '#FFFFFF';

  constructor(
    private authS: AuthService,
    private eventS: EventService,
    private snack: MatSnackBar,
    private route: ActivatedRoute,
    public location: Location,
    private fireStorage: AngularFireStorage
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        // Get eid from route params
        this.eid = params.get('eid');
        // Fetch event information
        if (this.eid){
          this.eventS.getEvent(this.eid).then(e => {
            if (e){
              this.event = e;
              this.areaColor = areasList.Tec21[e.areaT21].color;
               // Retrieve logo from students group
              const storageRef = this.fireStorage.storage;
              this.event.organizingGroups.forEach(element => {
                const logoRef = storageRef.ref(`sociedades/${element}.png`);
                logoRef.getDownloadURL().then(url => {
                     document.querySelector('.displayLogos').innerHTML +=
                      `<img src="${url}" alt="Logo de la mesa" class="logos" style= "width: 110px;">`;
                  }).catch( err => { console.log(err); });
                });
              } else { this.event = null; }
          });
         }
      })
    );
    // Subscribe to user following this event
    this.subscriptions.add(
      this.authS.observeAuthState().subscribe(state => this.following = (state.user && state.user.following.includes(this.eid)))
    );
  }

  private openSnack(message: string, action: string, ms: number): void {
    this.snack.open(message, action, {
      duration: ms,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  async toggleFollow(): Promise<void> {
    // If user is not authenticated, display invitation to login
    if (!(await this.authS.observeAuthState().pipe(take(1), map(state => state.loggedIn)).toPromise())) {
      this.openSnack(`Para seguir este evento, tienes que iniciar sesión`, 'ok', 2500)
    } else {
      if (this.following) {
        this.eventS.unsubscribeFromEvent(this.eid)
                   .then(() => this.openSnack(`Dejaste de seguir a este evento`, 'ok', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      } else {
        this.eventS.subscribeToEvent(this.eid)
                   .then(() => this.openSnack(`Ahora sigues a este evento`, 'Yay!', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      }
    }
  }

  copy(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    try {
      navigator.clipboard.writeText(url);
      alert('Url coppied to clipboard');
    }
    catch (err) {
      alert('Unable to copy text');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
