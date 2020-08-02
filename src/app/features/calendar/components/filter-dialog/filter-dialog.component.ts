import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { Event } from 'src/app/shared/interfaces/event.interface';

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.css']
})
export class FilterDialogComponent implements OnInit {
  areasList = areasList;
  @ViewChild('selAreas') selAreasRef: MatSelectionList;

  constructor(
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    public calendarS: CalendarService
  ) { }

  ngOnInit(): void { }

  onChangeSelAreas(event: MatSelectionListChange): void {
    const areas = event.source.selectedOptions.selected.map(op => op.value);
    this.calendarS.setFilter({areasT21: areas});
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
