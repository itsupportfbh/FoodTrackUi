import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CateringApiUrls } from './catering-api-urls';
import { environment } from 'environments/environment';
import { SessionApiUrls } from 'Urls/SessionApiUrls';
import { LocationApiUrls } from 'Urls/LocationApiUrls';
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
@Injectable({ providedIn: 'root' })
export class CateringService {
  private url = environment.apiUrl
  constructor(private http: HttpClient) { }

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(this.url + CateringApiUrls.companyList);
  }

  saveCompany(payload: any): Observable<any> {
    return this.http.post(this.url + CateringApiUrls.companySave, payload);
  }

  getMealPlansByCompany(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(this.url + CateringApiUrls.mealPlanByCompany(companyId));
  }
  deleteCompany(id: number): Observable<any[]> {
    return this.http.delete<any[]>(this.url + CateringApiUrls.companyDelete(id))
  }
  getOverrides(mealPlanId: number): Observable<any[]> {
    return this.http.get<any[]>(this.url + CateringApiUrls.mealPlanOverrides(mealPlanId));
  }

  saveMealPlan(payload: any): Observable<any> {
    return this.http.post(this.url + CateringApiUrls.mealPlanSave, payload);
  }

  saveOverride(payload: any): Observable<any> {
    return this.http.post(this.url + CateringApiUrls.mealPlanSaveOverride, payload);
  }

  getFinalQty(companyId: number, locationId: number | null, mealType: string, orderDate: string): Observable<any> {
    let params = new HttpParams()
      .set('companyId', companyId)
      .set('mealType', mealType)
      .set('orderDate', orderDate);
    if (locationId) {
      params = params.set('locationId', locationId);
    }
    return this.http.get(this.url + CateringApiUrls.mealPlanFinalQty, { params });
  }

  validateAndSaveScan(payload: any): Observable<any> {
    return this.http.post(this.url + CateringApiUrls.scannerValidateAndSave, payload);
  }

  generateMonthlyBilling(payload: any): Observable<any> {
    return this.http.post(this.url + CateringApiUrls.billingGenerateMonthly, payload);
  }
  getAllCuisine() {
    return this.http.get(this.url + `/Cuisine/GetCuisines`);
  }
  getSession() {
    return this.http.get<any>(`${environment.apiUrl}${SessionApiUrls.GetAllSession}`);
  }
  getLocation() {
    return this.http.get<any>(`${environment.apiUrl}${LocationApiUrls.GetAllLocation}`);
  }
getCompanyById(id: number) {
  return this.http.get<any>(`${environment.apiUrl}/Company/${id}`);
}
getPageMasters(userId: number) {
  return this.http.get<any>(`${environment.apiUrl}/Request/GetPageMasters?userId=${userId}`);
}
}
