import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard-component/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { SessionDemandComponent } from './session-demand/session-demand.component';
import { TopCompaniesComponent } from './top-companies/top-companies.component';
import { TotalCompanySummaryComponent } from './total-company-summary/total-company-summary.component';
import { CuisineSessionPerformanceComponent } from './cuisine-session-performance/cuisine-session-performance.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: { animation: 'dashboard' }
  },
];

@NgModule({
  declarations: [
    DashboardComponent,
    SessionDemandComponent,
    TopCompaniesComponent,
    TotalCompanySummaryComponent,
    CuisineSessionPerformanceComponent
  ],
  imports: [
    CommonModule,
     RouterModule.forChild(routes)
  ]
})
export class DashboardModule { }
