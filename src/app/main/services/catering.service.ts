import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CateringApiUrls } from './catering-api-urls';

@Injectable({ providedIn: 'root' })
export class CateringService {
  constructor(private http: HttpClient) {}

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(CateringApiUrls.companyList);
  }

  saveCompany(payload: any): Observable<any> {
    return this.http.post(CateringApiUrls.companySave, payload);
  }

  getMealPlansByCompany(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(CateringApiUrls.mealPlanByCompany(companyId));
  }

  getOverrides(mealPlanId: number): Observable<any[]> {
    return this.http.get<any[]>(CateringApiUrls.mealPlanOverrides(mealPlanId));
  }

  saveMealPlan(payload: any): Observable<any> {
    return this.http.post(CateringApiUrls.mealPlanSave, payload);
  }

  saveOverride(payload: any): Observable<any> {
    return this.http.post(CateringApiUrls.mealPlanSaveOverride, payload);
  }

  getFinalQty(companyId: number, locationId: number | null, mealType: string, orderDate: string): Observable<any> {
    let params = new HttpParams()
      .set('companyId', companyId)
      .set('mealType', mealType)
      .set('orderDate', orderDate);
    if (locationId) {
      params = params.set('locationId', locationId);
    }
    return this.http.get(CateringApiUrls.mealPlanFinalQty, { params });
  }

  validateAndSaveScan(payload: any): Observable<any> {
    return this.http.post(CateringApiUrls.scannerValidateAndSave, payload);
  }

  generateMonthlyBilling(payload: any): Observable<any> {
    return this.http.post(CateringApiUrls.billingGenerateMonthly, payload);
  }
}
