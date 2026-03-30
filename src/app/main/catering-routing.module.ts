import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyMasterComponent } from './company-master/company-master.component';
import { MealPlanComponent } from './meal-plan/meal-plan.component';
import { DailyOrderComponent } from './daily-order/daily-order.component';
import { ScannerComponent } from './scanner/scanner.component';
import { ReportsComponent } from './reports/reports.component';
import { BillingComponent } from './billing/billing.component';

const routes: Routes = [
  { path: 'company-master', component: CompanyMasterComponent },
  { path: 'meal-plan', component: MealPlanComponent },
  { path: 'daily-order', component: DailyOrderComponent },
  { path: 'scanner', component: ScannerComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'billing', component: BillingComponent },
  { path: '', pathMatch: 'full', redirectTo: 'company-master' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CateringRoutingModule {}
