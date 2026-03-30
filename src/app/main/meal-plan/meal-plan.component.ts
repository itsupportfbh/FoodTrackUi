import { Component, OnInit } from '@angular/core';
import { CateringService } from '../services/catering.service';

@Component({
  selector: 'app-meal-plan',
  templateUrl: './meal-plan.component.html',
  styleUrls: ['./meal-plan.component.scss']
})
export class MealPlanComponent implements OnInit {
  companies: any[] = [];
  plans: any[] = [];
  overrides: any[] = [];

  planForm: any = {
    id: null,
    companyId: null,
    locationId: null,
    mealType: 'Lunch',
    fromDate: '',
    toDate: '',
    qty: 250,
    remarks: '',
    userId: 1
  };

  overrideForm: any = {
    id: null,
    mealPlanId: null,
    companyId: null,
    locationId: null,
    mealType: 'Lunch',
    fromDate: '',
    toDate: '',
    qty: 240,
    reason: '',
    userId: 1
  };

  constructor(private srv: CateringService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.srv.getCompanies().subscribe(res => {
      this.companies = res || [];
      if (this.companies.length && !this.planForm.companyId) {
        this.planForm.companyId = this.companies[0].id;
        this.overrideForm.companyId = this.companies[0].id;
        this.loadPlans();
      }
    });
  }

  loadPlans(): void {
    if (!this.planForm.companyId) return;
    this.srv.getMealPlansByCompany(this.planForm.companyId).subscribe(res => this.plans = res || []);
  }

  editPlan(row: any): void {
    this.planForm = {
      id: row.id,
      companyId: row.companyId,
      locationId: row.locationId,
      mealType: row.mealType,
      fromDate: row.fromDate?.substring(0, 10),
      toDate: row.toDate?.substring(0, 10),
      qty: row.qty,
      remarks: row.remarks,
      userId: 1
    };
    this.overrideForm.mealPlanId = row.id;
    this.overrideForm.companyId = row.companyId;
    this.overrideForm.locationId = row.locationId;
    this.overrideForm.mealType = row.mealType;
    this.loadOverrides(row.id);
  }

  loadOverrides(mealPlanId: number): void {
    this.srv.getOverrides(mealPlanId).subscribe(res => this.overrides = res || []);
  }

  savePlan(): void {
    this.srv.saveMealPlan(this.planForm).subscribe(() => this.loadPlans());
  }

  saveOverride(): void {
    this.srv.saveOverride(this.overrideForm).subscribe(() => {
      if (this.overrideForm.mealPlanId) {
        this.loadOverrides(this.overrideForm.mealPlanId);
      }
    });
  }
}
