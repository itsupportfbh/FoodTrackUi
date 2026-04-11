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

   getOrderDate(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetOrderDays`);
  }
}