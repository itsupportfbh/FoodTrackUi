import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
 private baseUrl = `${environment.apiUrl}/api/Dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`);
  }
}
