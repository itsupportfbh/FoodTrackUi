import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationComponent } from './location/location.component';

import { RouterModule } from '@angular/router';
import { CuisineComponent } from './cuisine/cuisine/cuisine.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SessionComponent } from './session/session.component';

const routes = [
  {
    path: 'location',
    component: LocationComponent,
    data: { animation: 'location' }
  },
    {
    path: 'session',
    component: SessionComponent,
    data: { animation: 'session' }
  },
  { path: 'cuisine', component: CuisineComponent ,data: { animation: 'cuisine' }},
 
]


@NgModule({
  declarations: [    LocationComponent,
    CuisineComponent,SessionComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class MasterModule { }
