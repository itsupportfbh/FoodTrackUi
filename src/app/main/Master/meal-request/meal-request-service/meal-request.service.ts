import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MealRequestService {
  private apiUrl = `${environment.apiUrl}/MealRequest`;

  constructor(private http: HttpClient) {}

  saveMealRequest(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/SaveMealRequest`, payload);
  }

  getAllMealRequests(companyId: number, userId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/GetAllMealRequests?companyId=${companyId}&userId=${userId}`
    );
  }

  getMealRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetMealRequestById/${id}`);
  }

  deleteMealRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/DeleteMealRequest/${id}`);
  }
}