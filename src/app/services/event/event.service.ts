import { Injectable } from '@angular/core';
import { AuthService, AuthState } from '../auth/auth.service';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { Event } from '../../shared/interfaces/event.interface';
import { EventSummary } from '../../shared/interfaces/event-summary.interface';
import { firestore, database, User } from 'firebase';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private authState: AuthState;
  private eventDetails: {[uid: string]: Event} = {};

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) {
    // Subscribe to changes in auth state from AuthService
    this.auth.observeAuthState().subscribe(state => this.authState = state);
  }

  /**
   * Creates an event in the Firebase database and returns a Promise
   * with the data of the newly created event. This method requires
   * admin privileges over the group
   * @async
   * @param  gid  Id of the group that creates this event
   * @param  data Data of the event to be created (eid should be null)
   *              as it will be determined during document creation
   * @return      Promise with a data of the newly created event
   */
  createEvent(gid: string, data: Event): Promise<Event> {
    // Validate group admin privileges over the group
    if (!(this.authState.user.administra.includes(gid))) {
      throw Error('Operation needs admin over ' + gid);
    }
    // Create a new id for the event
    data.eid = this.afs.createId();
    // Get references to Firebase Documents
    const refs: {months: DocumentReference[], event: DocumentReference} = {
      months: this.generateMonthIds(data.timestamp.start, data.timestamp.end)
                  .map(mid => this.afs.doc<EventSummary[]>(`months/${mid}`).ref),
      event: this.afs.doc<Event>(`events/${data.eid}`).ref
    };
    // Run transaction
    return this.afs.firestore.runTransaction(async trans => {
      // Create event
      trans.set(refs.event, data);
      // Add event to all the months it belongs to
      refs.months.reduce(async (promise, mref) => {
        await promise;
        trans.set(mref, {[data.eid]: this.mapEventToEventSummary(data)}, {merge: true});
      }, Promise.resolve());
      return data;
    }).then(event => this.eventDetails[event.eid] = event);
  }

  /**
   * Gets the data of an event either from local storage (if available) or
   * from the Firebase database.
   * @async
   * @param  eid         Id of the event to get
   * @param  forceUpdate If true, forces the function to fetch a snapshot from
   *                     Firebase and updates stored value (defaults to false)
   * @return             Promise with the event data
   */
  getEvent(eid: string, forceUpdate: boolean = true): Promise<Event> {
    // Check if the event is available localy or if a snapshot must be fetched
    return (!this.eventDetails[eid] || forceUpdate) ?
      this.afs.doc<Event>(`events/${eid}`).get().toPromise()
              .then(snap => {
                this.eventDetails[eid] = snap.data() as Event;
                // Parse Firebase date formats from data
                this.eventDetails[eid].timestamp = {
                  start: (this.eventDetails[eid].timestamp.start as any).toDate(),
                  end: (this.eventDetails[eid].timestamp.end as any).toDate()
                };
                return this.eventDetails[eid];
              }) :
      Promise.resolve(this.eventDetails[eid]);
  }


  /**
   * Updates the info of an event in the Firebase database and returns a
   * Promise with a boolean value of wether the operation was successfull
   * This method requires admin privileges over the group
   * @async
   * @param  eid  Id of the group that creates this event
   * @param  data Data of the event to be created (eid should be null)
   *              as it will be determined during document creation
   */
  async updateEvent(eid: string, data: Partial<Event>): Promise<void> {

    const event: {old: Event, new: Event, ref: DocumentReference} = {
      old: null, new: null, ref: this.afs.doc<Event>(`events/${eid}`).ref
    };
    const months: {remove: string[], add: string[]} = { remove: [], add: [] };

    return this.afs.firestore.runTransaction(async trans => {
      // Retrieve old information of event
      event.old = (await trans.get(event.ref)).data() as Event;
      // Parse Firebase date formats from data
      event.old.timestamp = {start: (event.old.timestamp.start as any).toDate(), end: (event.old.timestamp.end as any).toDate()};
      // Build new event object
      event.new = {...event.old, ...data, eid: event.old.eid};

      // Check group admin permissions
      if ( !this.authState.user.administra.some(gid => event.old.organizingGroups.includes(gid))) {
        throw Error('The current user has no permissions to update this event');
      }

      // Determine months to remove and add
      months.remove = this.generateMonthIds(event.old.timestamp.start, event.old.timestamp.end);
      months.add = this.generateMonthIds(event.new.timestamp.start, event.new.timestamp.end);
      // Determine minimum month removals (to reduce document writes)
      months.remove = months.remove.filter(mid => !months.add.includes(mid));

      // Process month removals
      await months.remove.reduce(async (promise, mid) => {
        await promise;
        const ref = this.afs.doc(`months/${mid}`).ref;
        trans.update(ref, {[event.new.eid]: firestore.FieldValue.delete()});
      }, Promise.resolve());

      // Process month additions
      await months.add.reduce(async (promise, mid) => {
        await promise;
        const ref = this.afs.doc(`months/${mid}`).ref;
        trans.set(ref, {[event.new.eid]: this.mapEventToEventSummary(event.new)}, {merge: true});
      }, Promise.resolve());

      // Update event document
      trans.update(event.ref, event.new);
    });
  }

  /**
   * Gets the data of an event either from local storage (if available) or
   * from the Firebase database.
   * @async
   * @param  eid  Id of the event to delete
   */
  deleteEvent(eid: string): Promise<void> {

    const event: {old: Event, ref: DocumentReference} = {
      old: null, ref: this.afs.doc<Event>(`events/${eid}`).ref
    };
    const months: {remove: string[]} = { remove: [] };

    return this.afs.firestore.runTransaction(async trans => {
      // Retrieve old information of event
      event.old = (await trans.get(event.ref)).data() as Event;
      // Parse Firebase date formats from data
      event.old.timestamp = {start: (event.old.timestamp.start as any).toDate(), end: (event.old.timestamp.end as any).toDate()};

      // Check group admin permissions
      if ( !this.authState.user.administra.some(gid => event.old.organizingGroups.includes(gid))) {
        throw Error('The current user has no permissions to update this event');
      }

      // Determine months to remove
      months.remove = this.generateMonthIds(event.old.timestamp.start, event.old.timestamp.end);

      // Process month removals
      await months.remove.reduce(async (promise, mid) => {
        await promise;
        const ref = this.afs.doc(`months/${mid}`).ref;
        trans.update(ref, {[event.old.eid]: firestore.FieldValue.delete()});
      }, Promise.resolve());

      // Update event document
      trans.delete(event.ref);
    });
  }

  /**
   * Favorites an event on behalf of the current user
   * @async
   * @param  eid  Id of the event to delete
   */
  favoriteEvent(eid: string): Promise<void> {
    // Check that user is authenticated
    if (!this.authState.user) {
      throw Error('The current user is not authenticated');
    }
    const      uid = this.authState.uid;
    const eventRef = this.afs.doc<Event>(`events/${eid}`).ref;
    const  userRef = this.afs.doc<User>(`users/${uid}`).ref;

    return this.afs.firestore.runTransaction(async trans => {
      trans.update(userRef, {favorite: firestore.FieldValue.arrayUnion(eid)});
      trans.update(eventRef, {favoriteof: firestore.FieldValue.arrayUnion(uid)});
    });
  }

  // TO DO
  unsubscribeFromEvent(eid: string): Promise<void> {
    // Check that user is authenticated
    if (!this.authState.user) {
      throw Error('The current user is not authenticated');
    }
    const      uid = this.authState.uid;
    const eventRef = this.afs.doc<Event>(`events/${eid}`).ref;
    const  userRef = this.afs.doc<User>(`users/${uid}`).ref;

    return this.afs.firestore.runTransaction(async trans => {
      trans.update(userRef, {favorite: firestore.FieldValue.arrayRemove(eid)});
      trans.update(eventRef, {favoriteof: firestore.FieldValue.arrayRemove(uid)});
    });
  }

  generateMonthIds(start: Date, end?: Date): string[] {
    const offset = start.getTimezoneOffset() * 60 * 1000; // Timezone offset to get begin and end of UTC year
    const margin = 7 * 24 * 60 * 1000; // Margin of dates to include in prev or next month doc

    if (!end) { end = start; }

    const ids = [];
    const years = {from: start.getUTCFullYear(), to: end.getUTCFullYear()};
    for (let y = years.from; y <= years.to; y++) {
      const months = {
        from: (new Date(Math.max((new Date(y,  0,  1,  0,  0,  0,    0)).getTime() - offset, start.getTime() - margin))).getUTCMonth(),
        to:   (new Date(Math.min((new Date(y, 11, 31, 23, 59, 59, 9999)).getTime() - offset,   end.getTime() + margin))).getUTCMonth()
      };
      for (let m = months.from; m <= months.to; m++) {
        ids.push(`${y}-${((m < 9) ? '0' : '') + (m + 1)}`);
      }
    }
    return ids;
  }

  mapEventToEventSummary(event: Event): EventSummary {
    return {
      eid: event.eid,
      title: event.title,
      type: event.type,
      areaT21: event.areaT21,
      organizingGroups: [...event.organizingGroups],
      timestamp: {...event.timestamp},
    };
  }
}
