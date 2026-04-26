import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealRequestComponent } from './meal-request/meal-request.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CoreSidebarModule } from '@core/components';
import { ShowQrComponent } from './show-qr/show-qr.component';

const routes = [
      {
    path: 'meal-request',
    component: MealRequestComponent,
    data: { animation: 'mealrequest' }
  },
        {
    path: 'show-qr',
    component: ShowQrComponent,
    data: { animation: 'showqr' }
  },
]


@NgModule({
  declarations: [
    MealRequestComponent,
    ShowQrComponent
  ],
  imports: [
    CommonModule,
     RouterModule.forChild(routes),
         FormsModule,
         CoreSidebarModule,
             ReactiveFormsModule,
             HttpClientModule,
             RouterModule,
             NgxDatatableModule,
         NgSelectModule,
         NgbDropdownModule,
         NgbTooltipModule
  ]
})
export class MealRequestModule { }
