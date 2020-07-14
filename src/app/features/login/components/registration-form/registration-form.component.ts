import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/shared/interfaces/user.interface';

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit {
  @Input() userData: User;
  @Output() save = new EventEmitter<any>();
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

  getMajorsList(model: string): string[] {
    const majors = {
      tec20: ['ADI', 'ARQ', 'BIO', 'CIS', 'COM', 'IA ', 'IAB', 'IBN', 'IBT', 'IC ', 'IDA', 'IDS', 'IFI',
              'IIA', 'IID', 'IIN', 'IIS', 'IMA', 'IMD', 'IME', 'IMI', 'IMT', 'INC', 'ING', 'INT', 'IQA',
              'IQP', 'IQS', 'ISC', 'ISD', 'ITC', 'ITE', 'ITI', 'ITM', 'ITS', 'LAC', 'LAD', 'LAE', 'LAF',
              'LAN', 'LAS', 'LAT', 'LBC', 'LCC', 'LCD', 'LCE', 'LCM', 'LCP', 'LCQ', 'LCS', 'LDC', 'LDF',
              'LDI', 'LDN', 'LDP', 'LEC', 'LED', 'LEF', 'LEM', 'LEP', 'LHC', 'LIN', 'LLE', 'LLN', 'LMC',
              'LMI', 'LNB', 'LP ', 'LPL', 'LPM', 'LPO', 'LPS', 'LRI', 'LSC', 'LTS', 'MC ', 'MO ', 'NEG',
              'SLD', 'TIE'],
      tec21: ['AMC', 'ARQ', 'BGB', 'CIS', 'ESC', 'IAG', 'IAL', 'IBQ', 'IBT', 'IC ', 'ICI', 'ICT', 'IDM',
              'IDS', 'IE ', 'IFI', 'IID', 'IIS', 'IIT', 'IM ', 'IMD', 'IMT', 'INA', 'IQ ', 'IRS', 'ITC',
              'ITD', 'LAD', 'LAE', 'LAF', 'LBC', 'LC ', 'LCP', 'LDE', 'LDI', 'LDO', 'LEC', 'LED', 'LEI',
              'LEM', 'LIN', 'LIT', 'LLE', 'LNB', 'LPE', 'LPS', 'LRI', 'LTM', 'LTP', 'LUB', 'MC ', 'MO ',
              'NEG', 'SLD']
    };
    return (['tec20', 'tec21'].indexOf(model) !== -1) ? majors[model] : [];
  }

  onSubmit(): boolean {
    // Fail if some fields are invalid
    this.userForm.markAsTouched();
    if (!this.userForm.valid) { return false; }

    const value: any = {};
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
