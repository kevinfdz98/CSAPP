import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { AngularFirestore } from '@angular/fire/firestore';
import { Event } from 'src/app/shared/interfaces/event.interface';
import { User } from 'src/app/shared/interfaces/user.interface';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

interface EventReport {
  eid: string;
  title: string;
  type: string;
  area: string;
  organizingGroups: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  place: string;
  description: string;
  linkRegister: string;
  linkEvent: string;
  imgUrl: string;
  favoriteCount: number;
}

interface EventWithUsersReport {
  eid: string;
  title: string;
  type: string;
  area: string;
  organizingGroups: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  place: string;
  matricula: string;
  fName: string;
  lName: string;
  email: string;
  model: string;
  major: string;
  semester: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private usersList: {[uid: string]: User} = {};

  constructor(
    private afs: AngularFirestore
  ) { }

  async generateEventsWithUsersReport(gid: string, from: Date, to: Date): Promise<void> {
    const ref = this.afs.collection('events').ref;
    const query = ref.orderBy('timestamp.start')
                      .where('timestamp.start', '>=', from)
                      .where('timestamp.start', '<=', to)
                      .where('organizingGroups', 'array-contains', gid);
    const result: EventWithUsersReport[] = [];

    // Build rows doing a left join with Events.favoriteOf and Users
    await (await query.get()).docs.reduce(async (promiseA: Promise<void>, doc) => {
      await promiseA;

      const event = doc.data() as Event;
      console.log(event);
      await event.favoriteof.reduce(async (promiseB: Promise<void>, uid) => {
        await promiseB;

        // If user info is missing, fetch from Firebase
        if (!this.usersList[uid]) {
          this.usersList[uid] = (await this.afs.doc(`users/${uid}`).get().toPromise()).data() as User;
          console.log(this.usersList[uid]);
        }

        try {
          result.push({
            eid:              event.eid,
            title:            event.title,
            type:             event.type,
            area:             event.areaT21,
            organizingGroups: event.organizingGroups.join(', '),
            startDate:        ((event.timestamp.start as any).toDate() as Date).toLocaleDateString(),
            startTime:        ((event.timestamp.start as any).toDate() as Date).toLocaleTimeString(),
            endDate:          ((event.timestamp.end as any).toDate() as Date).toLocaleDateString(),
            endTime:          ((event.timestamp.end as any).toDate() as Date).toLocaleTimeString(),
            place:            event.place,
            matricula:        this.usersList[uid].matricula,
            fName:            this.usersList[uid].fName,
            lName:            this.usersList[uid].lName,
            email:            this.usersList[uid].email,
            model:            this.usersList[uid].model,
            major:            this.usersList[uid].major,
            semester:         this.usersList[uid].semester,
          });
        } catch (err) {
          console.warn(`Skipped user with uid ${uid}: ${err}`);
        }
      }, Promise.resolve());
    }, Promise.resolve());
    this.exportAsExcelFile(result, `export-${gid}-${(new Date()).toLocaleTimeString()}`);
  }

  async generateEventsReport(gid: string, from: Date, to: Date): Promise<void> {
    const ref = this.afs.collection('events').ref;
    const query = ref.orderBy('timestamp.start')
                      .where('timestamp.start', '>=', from)
                      .where('timestamp.start', '<=', to)
                      .where('organizingGroups', 'array-contains', gid);
    const result: EventReport[] = (await query.get()).docs.map(doc => {
      const data = doc.data() as Event;
      try {
        return {
          eid:              data.eid,
          title:            data.title,
          type:             data.type,
          area:             data.areaT21,
          organizingGroups: data.organizingGroups.join(', '),
          startDate:        ((data.timestamp.start as any).toDate() as Date).toLocaleDateString(),
          startTime:        ((data.timestamp.start as any).toDate() as Date).toLocaleTimeString(),
          endDate:          ((data.timestamp.end as any).toDate() as Date).toLocaleDateString(),
          endTime:          ((data.timestamp.end as any).toDate() as Date).toLocaleTimeString(),
          place:            data.place,
          description:      data.description,
          linkRegister:     data.linkRegister,
          linkEvent:        data.linkEvent,
          imgUrl:           data.imgUrl,
          favoriteCount:    data.favoriteof.length,
        };
      } catch (err) {
        console.warn(`Skipped event with eid ${data.eid}: ${err}`);
      }
    });
    this.exportAsExcelFile(result, `export-${gid}-${(new Date()).toLocaleTimeString()}`);
  }

  private exportAsExcelFile(json: any[], fileName: string): void {
    const sht: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const wrkbk: XLSX.WorkBook = {
      Sheets: {data: sht},
      SheetNames: ['data']
    };
    const buffer: any = XLSX.write(wrkbk, {bookType: 'xlsx', type: 'array'});
    this.saveExcelFile(buffer, fileName);
  }

  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }
}
