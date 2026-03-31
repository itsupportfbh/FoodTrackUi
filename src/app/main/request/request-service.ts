import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { RequestApiUrls } from 'Urls/RequestApiUrls ';


@Injectable({
  providedIn: 'root'
})
export class RequestService {
    private url = `${environment.apiUrl}/api`;
  

  constructor(private http: HttpClient) {}

  getPageMasters(userId: number, companyId: number): Observable<any> {
    let params = new HttpParams()
      .set('userId', userId)
      .set('companyId', companyId)
    

    return this.http.get<any>(this.url + RequestApiUrls.GetPageMasters, { params });
  }

  getAllRequests(filters: any): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters || {}).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<any>(this.url + RequestApiUrls.GetAllRequests, { params });
  }

  getRequestById(id: number): Observable<any> {
    return this.http.get<any>(this.url + RequestApiUrls.GetRequestById + id);
  }

  saveRequest(data: any): Observable<any> {
    return this.http.post<any>(this.url + RequestApiUrls.SaveRequest, data);
  }

  deleteRequest(id: number, userId: number): Observable<any> {
    return this.http.delete<any>(this.url + RequestApiUrls.DeleteRequest + id + `?userId=${userId}`);
  }
}