import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CateringRoutingModule } from './catering-routing.module';
import { CompanyMasterComponent } from './company-master/company-master.component';
import { MealPlanComponent } from './meal-plan/meal-plan.component';
import { DailyOrderComponent } from './daily-order/daily-order.component';
import { ScannerComponent } from './scanner/scanner.component';
import { ReportsComponent } from './reports/reports.component';
import { BillingComponent } from './billing/billing.component';
import { RouterModule } from '@angular/router';
import { AppComponent } from 'app/app.component';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CompanySidebarComponent } from './company-master/company-sidebar/company-sidebar.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreSidebarModule } from '@core/components';
import { RequestListComponent } from './request/request-list/request-list.component';
import { RequestCreateComponent } from './request/request-create/request-create.component';

const routes = [
  {
    path: 'CompanyMaster',
    component: CompanyMasterComponent,
    data: { animation: 'companyMaster' }
  },
    {
    path: 'daily-order',
    component: DailyOrderComponent,
    data: { animation: 'daily-order' }
  },
    {
    path: 'meal-plan',
    component: MealPlanComponent,
    data: { animation: 'meal-plan' }
  },
    {
    path: 'reports',
    component: ReportsComponent,
    data: { animation: 'reports' }
  },
    {
    path: 'scanner',
    component: ScannerComponent,
    data: { animation: 'scanner' }
  },
      {
    path: 'request',
    component: RequestListComponent,
    data: { animation: 'createpurchaserequest' }
  },
    {
    path: 'request-create',
    component: RequestCreateComponent,
    data: { animation: 'createpurchaserequest' }
  },
  {
    path: 'request-edit/:id',
    component: RequestCreateComponent,
    
  },
]
@NgModule({
  declarations: [
    CompanyMasterComponent,
    MealPlanComponent,
    DailyOrderComponent,
    ScannerComponent,
    ReportsComponent,
    BillingComponent,
    CompanySidebarComponent,
    RequestListComponent,
    RequestCreateComponent,
    
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    CateringRoutingModule,
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
export class CateringModule {}
