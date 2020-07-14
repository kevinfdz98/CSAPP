import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { AngularMaterialModule } from '../../shared/modules/angular-material.module';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    LoginComponent,
    RegistrationFormComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ]
})
export class LoginModule { }
