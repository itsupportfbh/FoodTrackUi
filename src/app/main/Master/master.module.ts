import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationComponent } from './location/location.component';
import { ItemsComponent } from './items/items.component';
import { RouterModule } from '@angular/router';
import { CuisineComponent } from './cuisine/cuisine/cuisine.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreSidebarModule } from '@core/components';

const routes = [
  {
    path: 'location',
    component: LocationComponent,
    data: { animation: 'location' }
  },
    {
    path: 'items',
    component: ItemsComponent,
    data: { animation: 'items' }
  },
  { path: 'cuisine', component: CuisineComponent ,data: { animation: 'cuisine' }},
 
]


@NgModule({
  declarations: [    LocationComponent,
    ItemsComponent,CuisineComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class MasterModule { }
