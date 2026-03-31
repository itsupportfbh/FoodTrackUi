import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationComponent } from './location/location.component';

import { RouterModule } from '@angular/router';
import { CuisineComponent } from './cuisine/cuisine/cuisine.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SessionComponent } from './session/session.component';
import { SitesettingsComponent } from './sitesettings/sitesettings.component';

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
   { path: 'site_settings', component: SitesettingsComponent ,data: { animation: 'site_settings' }},

 
]


@NgModule({
  declarations: [    LocationComponent,
    CuisineComponent,SessionComponent,SitesettingsComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class MasterModule { }
