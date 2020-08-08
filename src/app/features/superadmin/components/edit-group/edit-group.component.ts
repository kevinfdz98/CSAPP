import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Group } from 'src/app/shared/interfaces/group.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Major, majorsList } from 'src/app/shared/interfaces/major.interface';
import { Area, areasList } from 'src/app/shared/interfaces/area.interface';
import { LogoUploadComponent } from '../logo-upload/logo-upload.component';

export interface EditGroupData {
  action: 'create' | 'edit';
  group: Partial<Group>;
}

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.css']
})
export class EditGroupComponent implements OnInit {

  areasList: {Tec20: {[aid: string]: Area}, Tec21: {[aid: string]: Area}};
  Tec21ByArea: {[aid: string]: Major[]};
  Tec20ByArea: {[aid: string]: Major[]};
  groupForm: FormGroup;
  @ViewChild('uploadBtn') uploadBtnRef: LogoUploadComponent;
  constructor(
    public dialogRef: MatDialogRef<EditGroupComponent, EditGroupData>,
    @Inject(MAT_DIALOG_DATA) public data: EditGroupData,
    private fb: FormBuilder,
    ) {
      this.groupForm = fb.group({
        gid         : ['', Validators.required],
        name        : ['', Validators.required],
        majorsTec21 : [''],
        majorsTec20 : [''],
      });
    }


  ngOnInit(): void {
    // Make areasList accessible to html template
    this.areasList = areasList;

    // Deconstruct Tec21 majors by area
    this.Tec21ByArea = Object.values(majorsList.Tec21).reduce((obj, major) => {
      const nameOfArea = areasList.Tec21[major.area].name;
      if (!obj[nameOfArea]) { obj[nameOfArea] = []; }
      obj[nameOfArea].push(major);
      return obj;
    }, {} as {[aid: string]: Major[]});
    // Deconstruct Tec20 majors by area
    this.Tec20ByArea = Object.values(majorsList.Tec20).reduce((obj, major) => {
      const nameOfArea = areasList.Tec20[major.area].name;
      if (!obj[nameOfArea]) { obj[nameOfArea] = []; }
      obj[nameOfArea].push(major);
      return obj;
    }, {} as {[aid: string]: Major[]});

    // Populate form fields
    if (this.data.group) {
      this.groupForm.setValue({
        gid         : this.data.group.gid,
        name        : this.data.group.name,
        majorsTec21 : this.data.group.majorsTec21,
        majorsTec20 : this.data.group.majorsTec20
      });
    }
  }

  async onSubmit(): Promise<boolean> {
    // Fail if some fields are invalid
    this.groupForm.markAsTouched();
    if (!this.groupForm.valid) { return false; }

    const value: Partial<Group> = {
      name: this.groupForm.get('name').value,
      majorsTec21: this.groupForm.get('majorsTec21').value,
      majorsTec20: this.groupForm.get('majorsTec20').value,
    };
    value.logoUrl =  await this.uploadBtnRef.getImageUrl();
    value.majorsTec21 = (typeof value.majorsTec21.length === 'string') ? [] : this.groupForm.get('majorsTec21').value;
    value.majorsTec20 = (typeof value.majorsTec20.length === 'string') ? [] : this.groupForm.get('majorsTec20').value;
    if (this.data.action === 'create') { value.gid = this.groupForm.get('gid').value; }
    if (this.data.action === 'create') { value.admins = []; }

    this.dialogRef.close({...this.data, group: value});
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
