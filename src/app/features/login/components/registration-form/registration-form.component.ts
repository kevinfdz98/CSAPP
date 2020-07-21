import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/shared/interfaces/user.interface';
import { Major, majorsList } from 'src/app/shared/interfaces/major.interface';
import { Model } from 'src/app/shared/enums/model.enum';

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit {
  @Input() userData: User;
  @Output() save = new EventEmitter<Partial<User>>();
  userForm: FormGroup;

  constructor(
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
    if (this.userData.matricula) {
      this.userForm.get('model').setValidators(Validators.required);
      this.userForm.get('major').setValidators(Validators.required);
      this.userForm.get('semester').setValidators(Validators.required);
    }
    if (this.userData) {
      this.userForm.setValue({
        email     : this.userData.email     ? this.userData.email     : '',
        matricula : this.userData.matricula ? this.userData.matricula : '',
        fName     : this.userData.fName     ? this.userData.fName     : '',
        lName     : this.userData.lName     ? this.userData.lName     : '',
        model     : this.userData.model     ? this.userData.model     : '',
        major     : this.userData.major     ? this.userData.major     : '',
        semester  : this.userData.semester  ? this.userData.semester  : ''
      });
    }
  }

  getMajorsList(model: Model): string[] {
    return Object.values(majorsList[model]).map(major => major.mid);
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

    this.save.emit(value);
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

}
