import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private baseUrl = `${environment.apiUrl}/Request`;

  constructor(private http: HttpClient) {}
  private siteUrl = `${environment.apiUrl}/SiteSettings`;
 
  getPageMasters(userId: number, companyId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetPageMasters?userId=${userId}`);
  }

  getAllRequests(userId: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAllRequests?userId=${userId}`);
  }

  getRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetRequestById/${id}`);
  }

  saveRequest(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/SaveRequest`, payload);
  }

  deleteRequest(id: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/DeleteRequest/${id}?userId=${userId}`);
  }


  
getLatestSiteSetting(): Observable<any> {
  return this.http.get<any>(`${this.siteUrl}/GetLatestSiteSetting`);
}

   getOrderDate(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetOrderDays`);
  }
  checkOverlap(companyId: number, fromDate: string, toDate: string, id: number = 0) {
  return this.http.get<any>(`${environment.apiUrl}/request/check-overlap`, {
    params: {
      companyId,
      fromDate,
      toDate,
      id
    }
  });
}
getDefaultPlanRates(): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/CuisinePrice/GetDefaultPlanRates`);
}

}