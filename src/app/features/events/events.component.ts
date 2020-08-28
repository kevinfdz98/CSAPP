import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventService } from 'src/app/services/event/event.service';
import { Subscription, Observable } from 'rxjs';
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
  private eventSubscription: Subscription = null;
  private eid: string;
  public event: Event;
  public favorite: boolean;
  public registered: boolean;
  public areaColor = '#FFFFFF';
  public try: any;
  public favoriteCount: number;
  public registeredCount: number;

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
        if (this.eid) {
          // If already subscribed to an event, unsubscribe
          if (this.eventSubscription && !this.eventSubscription.closed) { this.eventSubscription.unsubscribe(); console.log('unsubscribe from event'); }
          // Subscribe to event
          this.eventSubscription = this.eventS.getEventObservable(this.eid).subscribe(e => {
            if (e) {
              this.areaColor = areasList.Tec21[e.areaT21].color;
              this.favoriteCount = (e && e.favoriteof) ?  e.favoriteof.length : 0;
              this.registeredCount = (e && e.registered) ?  Object.keys(e.registered).length : 0;
              // If logos changed, reload logos in display
              if (!this.event || (e.organizingGroups.toString() !== this.event.organizingGroups.toString())) {
                console.log('ok');
                this.displayLogos(e.organizingGroups);
              }
              this.event = e;
              } else { this.event = null; }
          });
         }
      })
    );
    // Subscribe to user favorite this event
    this.subscriptions.add(
      this.authS.observeAuthState().subscribe(state => {
          this.favorite = (state.user && state.user.favorite.includes(this.eid));
          this.registered = (state.user && state.user.registeredIn.includes(this.eid));
      })
    );
  }

  private openSnack(message: string, action: string, ms: number): void {
    this.snack.open(message, action, {
      duration: ms,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  async toggleRegister(): Promise<void> {
    // If user is not authenticated, display invitation to login
    if (!(await this.authS.observeAuthState().pipe(take(1), map(state => state.loggedIn)).toPromise())) {
      this.openSnack(`Para registrarte en el evento, debes de iniciar sesión`, 'ok', 2500);
    } else {
      if (this.registered) {
        this.eventS.unregisterFromEvent(this.eid)
                   .then(() => this.openSnack(`Te desregistraste de este evento`, 'ok', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      } else {
        this.eventS.registerInEvent(this.eid)
                   .then(() => this.openSnack(`Te registraste en este evento`, 'Yay!', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      }
    }
  }

  async toggleFavorite(): Promise<void> {
    // If user is not authenticated, display invitation to login
    if (!(await this.authS.observeAuthState().pipe(take(1), map(state => state.loggedIn)).toPromise())) {
      this.openSnack(`Para dar favorito al evento, debes de iniciar sesión`, 'ok', 2500);
    } else {
      if (this.favorite) {
        this.eventS.unfavoriteFromEvent(this.eid)
                   .then(() => this.openSnack(`Le diste desfavorito a este evento`, 'ok', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      } else {
        this.eventS.favoriteEvent(this.eid)
                   .then(() => this.openSnack(`Le diste favorito a este evento`, 'Yay!', 1000))
                   .catch(reason => this.openSnack(`Error: ${reason}`, 'Oh noes!', 1000));
      }
    }
  }

  displayLogos(groups: string[]): void {
    // Erase current logos
    document.querySelector('.displayLogos').innerHTML = '';
    // Retrieve logos from storage
    const storageRef = this.fireStorage.storage;
    groups.forEach(element => {
      const logoRef = storageRef.ref(`sociedades/${element}.png`);
      logoRef.getDownloadURL().then(url => {
            document.querySelector('.displayLogos').innerHTML +=
            `<img src="${url}" alt="Logo de la mesa" class="logos" style=
            "width:${groups.length > 2 ? '55px' : '110px'} ;">`;
        }).catch( err => { });
      }
    );
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
    // If already subscribed to an event, unsubscribe
    if (!this.eventSubscription.closed) { this.eventSubscription.unsubscribe(); }
  }

}
