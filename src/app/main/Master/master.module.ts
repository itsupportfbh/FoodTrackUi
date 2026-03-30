import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationComponent } from './location/location.component';
import { ItemsComponent } from './items/items.component';
import { RouterModule } from '@angular/router';

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
 
]


@NgModule({
  declarations: [    LocationComponent,
    ItemsComponent,],
  imports: [
     RouterModule.forChild(routes),
    CommonModule
  ]
})
export class MasterModule { }
