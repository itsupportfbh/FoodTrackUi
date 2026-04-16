import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationComponent } from './location/location.component';

import { RouterModule } from '@angular/router';
import { CuisineComponent } from './cuisine/cuisine/cuisine.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SessionComponent } from './session/session.component';
import { SitesettingsComponent } from './sitesettings/sitesettings.component';
import { NgbDropdownModule, NgbTimepickerModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PriceMasterComponent } from './price-master/price-master.component';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreSidebarModule } from '@core/components';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

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

  { path: 'price', component: PriceMasterComponent ,data: { animation: 'price' }},
]


@NgModule({
  declarations: [    LocationComponent,
    CuisineComponent,SessionComponent,SitesettingsComponent, PriceMasterComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
     NgbTimepickerModule,
     FormsModule,
  HttpClientModule,
  NgSelectModule,

  NgbDropdownModule,
  NgbTooltipModule,
     CoreSidebarModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
      RouterModule,
      NgxDatatableModule,
      FormsModule,
  NgSelectModule,
  NgbDropdownModule,
  NgbTooltipModule
  ]
})
export class MasterModule { }
