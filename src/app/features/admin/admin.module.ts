import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { EditEventFormComponent } from './components/edit-event-form/edit-event-form.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MyFullCalendarModule } from 'src/app/shared/modules/my-fullcalendar.module';

@NgModule({
  declarations: [AdminComponent, EditEventFormComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    MyFullCalendarModule
  ]
})
export class AdminModule { }
