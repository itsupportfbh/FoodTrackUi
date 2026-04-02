import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestOverrideComponent } from './request-override.component';
import { RouterModule } from '@angular/router';
import { RequestOverrideListComponent } from './request-override-list/request-override-list.component';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

const routes = [
  {
    path: 'Request-override',
    component: RequestOverrideComponent,
    data: { animation: 'Request-override' }
  },
   {
    path: 'Request-override-list',
    component: RequestOverrideListComponent,
    data: { animation: 'Request-override-list' }
  },
]

@NgModule({
  declarations: [RequestOverrideComponent, RequestOverrideListComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    NgxDatatableModule
  ]
})
export class RequestOverrideModule { }
