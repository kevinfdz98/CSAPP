import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { EditEventFormComponent } from './components/edit-event-form/edit-event-form.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';
import { AngularFireStorage, AngularFireStorageModule } from '@angular/fire/storage';
import { from } from 'rxjs';

@NgModule({
  declarations: [AdminComponent, EditEventFormComponent, UploadButtonComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    MyFullCalendarModule,
    MatMomentDateModule,
    AngularFireStorageModule,
  ]
})
export class AdminModule { }
