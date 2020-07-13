import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { AngularMaterialModule } from '../../shared/modules/angular-material.module';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';


@NgModule({
  declarations: [
    LoginComponent,
    RegistrationFormComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    AngularMaterialModule
  ]
})
export class LoginModule { }
