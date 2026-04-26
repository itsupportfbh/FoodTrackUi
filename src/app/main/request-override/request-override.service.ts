import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestOverrideService {
  private apiUrl = `${environment.apiUrl}/RequestOverride`;

  constructor(private http: HttpClient) {}

getScreen(
  requestHeaderId: number,
  fromDate: string,
  toDate: string,
  requestOverrideId?: number   // 👈 ADD
): Observable<any> {

  let params = new HttpParams()
    .set('requestHeaderId', requestHeaderId)
    .set('fromDate', fromDate)
    .set('toDate', toDate);

  if (requestOverrideId) {
    params = params.set('requestOverrideId', requestOverrideId.toString());
  }

  return this.http.get<any>(`${this.apiUrl}/GetScreenData`, { params });
}

  save(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Save`, payload);
  }

  getOverrideList(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetOverrideList?companyId=${companyId}`);
  }

  getOverrideLines(requestOverrideId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetOverrideLines?requestOverrideId=${requestOverrideId}`);
  }

  delete(id: number, updatedBy: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Delete/${id}/${updatedBy}`);
  }
}