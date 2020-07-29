import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Event } from 'src/app/shared/interfaces/event.interface';
import { areasList, Area } from 'src/app/shared/interfaces/area.interface';
import { GroupService } from 'src/app/services/group/group.service';
import { UploadButtonComponent } from '../upload-button/upload-button.component';
import * as moment from 'moment';

export interface EditEventData {
  eventIn: Partial<Event>;
  eventOut: Partial<Event>;
}

@Component({
  selector: 'app-edit-event-form',
  templateUrl: './edit-event-form.component.html',
  styleUrls: ['./edit-event-form.component.css']
})
export class EditEventFormComponent implements OnInit {
  eventForm: FormGroup;
  areasTec21: {[aid: string]: Area};
  @ViewChild('uploadBtn') uploadBtnRef: UploadButtonComponent;

  constructor(
    public dialogRef: MatDialogRef<EditEventFormComponent, EditEventData>,
    @Inject(MAT_DIALOG_DATA) public data: EditEventData,
    fb: FormBuilder,
    public groupS: GroupService,
  ) {
    this.eventForm = fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      areaT21: ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required],
      groups: [[], Validators.required],
      description: [''],
      place: [''],
      linkRegister: [''],
      linkEvent: ['']
    });
  }

  ngOnInit(): void {
    const d = moment().add(1, 'hour').startOf('hour');
    const dStart = this.data.eventIn.timestamp && this.data.eventIn.timestamp.start ?
                   moment(this.data.eventIn.timestamp.start) : d.clone();
    const dEnd   = this.data.eventIn.timestamp && this.data.eventIn.timestamp.start ?
                   moment(this.data.eventIn.timestamp.start) : d.clone().add(1, 'hour');

    this.eventForm.setValue({
      title        : this.data.eventIn.title ?            this.data.eventIn.title  : null,
      type         : this.data.eventIn.type ?             this.data.eventIn.type  : null,
      areaT21      : this.data.eventIn.areaT21 ?          this.data.eventIn.areaT21  : null,
      startDate    : dStart.format('YYYY-MM-DD'),
      startTime    : dStart.format('HH:mm'),
      endDate      : dEnd.format('YYYY-MM-DD'),
      endTime      : dEnd.format('HH:mm'),
      groups       : this.data.eventIn.organizingGroups ? this.data.eventIn.organizingGroups  : [],
      description  : this.data.eventIn.description ?      this.data.eventIn.description  : null,
      place        : this.data.eventIn.place ?            this.data.eventIn.place  : null,
      linkRegister : this.data.eventIn.linkRegister ?     this.data.eventIn.linkRegister  : null,
      linkEvent    : this.data.eventIn.linkEvent ?        this.data.eventIn.linkEvent  : null
    });
    // Make areasList accessible to html template
    this.areasTec21 = areasList.Tec21;
  }

  async onSubmit(): Promise<boolean> {
    // Fail if some fields are invalid
    this.eventForm.markAsTouched();
    if (!this.eventForm.valid) { return false; }

    const value: Partial<Event> = {};
    value.eid              = this.data.eventIn.eid ? this.data.eventIn.eid : null;
    value.title            = this.eventForm.get('title').value;
    value.type             = this.eventForm.get('type').value;
    value.areaT21          = this.eventForm.get('areaT21').value;
    value.organizingGroups = this.eventForm.get('groups').value;
    value.timestamp        = {
      start: moment(this.eventForm.get('startDate').value).startOf('day')
                .add(moment.duration(this.eventForm.get('startTime').value))
                .toDate(),
        end: moment(this.eventForm.get('endDate').value).startOf('day')
                .add(moment.duration(this.eventForm.get('endTime').value))
                .toDate(),
    };
    value.place            = this.eventForm.get('place').value;
    value.description      = this.eventForm.get('description').value;
    value.linkRegister     = this.eventForm.get('linkRegister').value;
    value.linkEvent        = this.eventForm.get('linkEvent').value;
    value.imgUrl           = await this.uploadBtnRef.getImageUrl();

    this.dialogRef.close({...this.data, eventOut: value});
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

  onDelete(): boolean {
    this.dialogRef.close({...this.data, eventOut: null});
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
