import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { AngularFirestore } from '@angular/fire/firestore';
import { Event } from 'src/app/shared/interfaces/event.interface';

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

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(
    private afs: AngularFirestore
  ) { }

  async generateEventsReport(gid: string, from: Date, to: Date): Promise<void> {
    const ref = this.afs.collection('events').ref;
    const query = ref.orderBy('timestamp.start')
                      .where('timestamp.start', '>=', from)
                      .where('timestamp.start', '<=', to)
                      .where('organizingGroups', 'array-contains', gid);
    const result: EventReport[] = (await query.get()).docs.map(doc => {
      const data = doc.data() as Event;
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
    });
    console.log(result);
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
