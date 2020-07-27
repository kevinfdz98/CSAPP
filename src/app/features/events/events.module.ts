import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventsRoutingModule } from './events-routing.module';
import { EventsComponent } from './events.component';
import { AngularMaterialModule } from 'src/app/shared/modules/angular-material.module';


@NgModule({
  declarations: [EventsComponent],
  imports: [
    CommonModule,
    EventsRoutingModule,
    AngularMaterialModule,
  ]
})
export class EventsModule { }
