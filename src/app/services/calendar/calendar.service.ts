import { Injectable } from '@angular/core';
import { EventSummary } from 'src/app/shared/interfaces/event-summary.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Area } from 'src/app/shared/interfaces/area.interface';
import { EventTypes } from 'src/app/shared/enums/event-types.enum';

export interface Filter {
  areasT21: string[];
  types: EventTypes[];
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  private filter$ = new BehaviorSubject<Filter>({areasT21: [], types: []});
  private monthObjects: {[mid: string]: {[eid: string]: EventSummary}} = {};

  constructor(
    private afs: AngularFirestore
  ) { }

  get filter(): Observable<Filter> {
    return this.filter$.asObservable();
  }

  getFilterSnapshot(): Filter {
    return this.filter$.value;
  }

  setFilter(value: Partial<Filter>): void {
    this.filter$.next({...this.filter$.value, ...value});
  }

  async getEvents(start: Date, end: Date): Promise<EventSummary[]> {
    const monthIds = this.generateMonthIds(start, end);
    // Fetch events from local memory and/or from Firestore month by month
    const events = await monthIds.reduce<Promise<EventSummary[]>>(async (promise, mid) => {
      const acum = await promise;
      // If not in local memory, fetch from Firestore
      if (!this.monthObjects[mid]) {
        const ref = this.afs.doc<{[eid: string]: EventSummary}>(`months/${mid}`);
        const data = (await ref.get().toPromise()).data() as {[eid: string]: EventSummary};
        if (data) {
          // Parse Firebase date formats from data
          Object.values(data).forEach(e => {
            e.timestamp = {start: (e.timestamp.start as any).toDate(), end: (e.timestamp.end as any).toDate()};
          });
        }
        // Save the data fetched from Firestore
        this.monthObjects[mid] = data ? data : {};
      }
      // Accumulate events in array
      return [].concat(acum, Object.values(this.monthObjects[mid]));
    }, Promise.resolve([] as EventSummary[]));

    const filterSnap = this.filter$.value;
    return  events.filter(e =>
      (filterSnap.areasT21.length === 0 || filterSnap.areasT21.includes(e.areaT21)) &&
      (filterSnap.types.length === 0 || filterSnap.types.includes(e.type))
    );
  }

  refresh(): void {
    this.filter$.next({areasT21: [], types: []});
    this.monthObjects = {};
  }

  generateMonthIds(start: Date, end?: Date): string[] {
    const offset = start.getTimezoneOffset() * 60 * 1000; // Timezone offset to get begin and end of UTC year

    if (!end) { end = start; }
    const ids = [];
    const years = {from: start.getUTCFullYear(), to: end.getUTCFullYear()};
    for (let y = years.from; y <= years.to; y++) {
      const months = {
        from: (new Date(Math.max((new Date(y,  0,  1,  0,  0,  0,    0)).getTime() - offset, start.getTime()))).getUTCMonth(),
        to:   (new Date(Math.min((new Date(y, 11, 31, 23, 59, 59, 9999)).getTime() - offset,   end.getTime()))).getUTCMonth()
      };
      for (let m = months.from; m <= months.to; m++) {
        ids.push(`${y}-${((m < 9) ? '0' : '') + (m + 1)}`);
      }
    }
    return ids;
  }

}
