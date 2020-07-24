import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/shared/interfaces/user.interface';
import { majorsList } from 'src/app/shared/interfaces/major.interface';
import { Models } from 'src/app/shared/enums/major-models.enum';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RegistrationData {
  userData: User;
  saveData: Partial<User>;
}

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit {
  userForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<RegistrationFormComponent, RegistrationData>,
    @Inject(MAT_DIALOG_DATA) public data: RegistrationData,
    fb: FormBuilder
  ) {
    this.userForm = fb.group({
      email     : [''],
      matricula : [''],
      fName     : ['', Validators.required],
      lName     : ['', Validators.required],
      model     : [''],
      major     : [''],
      semester  : ['']
    });
  }

  ngOnInit(): void {
    // If Tec student, set additional validators
    if (this.data.userData.matricula) {
      this.userForm.get('model').setValidators(Validators.required);
      this.userForm.get('major').setValidators(Validators.required);
      this.userForm.get('semester').setValidators(Validators.required);
    }
    if (this.data.userData) {
      this.userForm.setValue({
        email     : this.data.userData.email     ? this.data.userData.email     : '',
        matricula : this.data.userData.matricula ? this.data.userData.matricula : '',
        fName     : this.data.userData.fName     ? this.data.userData.fName     : '',
        lName     : this.data.userData.lName     ? this.data.userData.lName     : '',
        model     : this.data.userData.model     ? this.data.userData.model     : '',
        major     : this.data.userData.major     ? this.data.userData.major     : '',
        semester  : this.data.userData.semester  ? this.data.userData.semester  : ''
      });
    }
  }

  getMajorsList(model: Models): string[] {
    console.log('model => ' + model);
    if (model === 'Tec20' || model === 'Tec21') {
      return Object.values(majorsList[model]).map(major => major.mid);
    }
    return [];
  }

  onSubmit(): boolean {
    // Fail if some fields are invalid
    this.userForm.markAsTouched();
    if (!this.userForm.valid) { return false; }

    const value: Partial<User> = {};
    value.fName    = this.userForm.get('fName').value;
    value.lName    = this.userForm.get('lName').value;
    // Atributos para alumnos Tec
    if (this.userForm.get('matricula').value !== '') {
      value.model    = this.userForm.get('model').value;
      value.major    = this.userForm.get('major').value;
      value.semester = this.userForm.get('semester').value;
    }

    this.dialogRef.close({...this.data, saveData: value});
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

}
