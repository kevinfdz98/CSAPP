import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ReportsService } from 'src/app/services/reports/reports.service';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { GroupSummary } from 'src/app/shared/interfaces/group-summary.interface';
import { GroupService } from 'src/app/services/group/group.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-reports-panel',
  templateUrl: './reports-panel.component.html',
  styleUrls: ['./reports-panel.component.css']
})
export class ReportsPanelComponent implements OnInit {

  reportsForm: FormGroup;
  groupsList: {[gid: string]: GroupSummary};

  constructor(
    fb: FormBuilder,
    private reportS: ReportsService,
    public groups: GroupService,
    ) {
    this.reportsForm = fb.group({
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required],
      group: ['', Validators.required],
      includeUsers: [''],
    });
  }

  ngOnInit(): void {}

  async onSubmit(): Promise<boolean> {
    // Fail if some fields are invalid
    this.reportsForm.markAsTouched();
    if (!this.reportsForm.valid) { return false; }

    const timestamp: {from: Date, to: Date} = {
      from: moment(this.reportsForm.get('startDate').value).startOf('day')
                .add(moment.duration(this.reportsForm.get('startTime').value))
                .toDate(),
        to: moment(this.reportsForm.get('endDate').value).startOf('day')
                .add(moment.duration(this.reportsForm.get('endTime').value))
                .toDate(),
    };
    if (timestamp.from >= timestamp.to) {
      alert('The "From" field must be greater than the "To" field');
      return false;
    }

    if (this.reportsForm.get('includeUsers').value) {
      this.reportS.generateEventsWithUsersReport(this.reportsForm.get('group').value, timestamp.from, timestamp.to);
    } else {
      this.reportS.generateEventsReport(this.reportsForm.get('group').value, timestamp.from, timestamp.to);
    }

    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

}
