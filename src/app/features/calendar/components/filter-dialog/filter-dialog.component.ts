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
  data: {value: string, color: string, selected: boolean, text: string}[] = null;
  @ViewChild('selAreas') selAreasRef: MatSelectionList;

  constructor(
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    public calendarS: CalendarService
  ) {
    // Initialize value of filter
    const filter = this.calendarS.getFilterSnapshot().areasT21;
    this.data = Object.values(areasList.Tec21).map(area => ({
      value: area.aid,
      color: area.color,
      selected: filter.includes(area.aid),
      text: area.aid + ' - ' + area.name,
    }));
  }

  ngOnInit(): void { }

  onChangeSelAreas(event: MatSelectionListChange): void {
    const areas = event.source.selectedOptions.selected.map(op => op.value);
    this.calendarS.setFilter({areasT21: areas});
  }

  onClear(): void {
    this.selAreasRef.deselectAll();
    this.calendarS.setFilter({areasT21: []});
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
