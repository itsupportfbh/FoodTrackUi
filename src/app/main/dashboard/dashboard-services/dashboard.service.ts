import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/Dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(filters?: any): Observable<any> {
    let params = new HttpParams();

    if (filters?.companyIds?.length) {
      filters.companyIds.forEach((id: number) => {
        params = params.append('companyIds', id.toString());
      });
    }

    if (filters?.sessionIds?.length) {
      filters.sessionIds.forEach((id: number) => {
        params = params.append('sessionIds', id.toString());
      });
    }

    if (filters?.locationIds?.length) {
      filters.locationIds.forEach((id: number) => {
        params = params.append('locationIds', id.toString());
      });
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }
}