import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = `${environment.apiUrl}/api/Report`;

  constructor(private http: HttpClient) {}

  getPageMasters(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetPageMasters?userId=${userId}`);
  }

  getReportByDates(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/GetReportByDates`, payload);
  }
  exportReportExcel(payload: any): Observable<Blob> {
  return this.http.post(`${this.baseUrl}/ExportReportExcel`, payload, {
    responseType: 'blob'
  });
  }

  sendReportEmail(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/SendReportEmail`, payload);
  }
}