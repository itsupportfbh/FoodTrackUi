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
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreSidebarModule } from '@core/components';

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
NgxDatatableModule,
NgSelectModule,
NgbDropdownModule
    
    
  ]
})
export class CateringModule {}
