import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface RequestOverrideHeader {
  requestHeaderId: number;
  requestNo: string;
  companyId: number;
  fromDate: string;
  toDate: string;
  overrideDate: string;
  notes: string;
}

export interface RequestOverrideLine {
  requestOverrideDetailId: number;
  requestDetailId: number;
  sessionId: number;
  cuisineId: number;
  locationId: number;
  baseQty: number;
  overrideQty: number;
  isCancelled: boolean;
}

export interface RequestOverrideScreen {
  header: RequestOverrideHeader;
  lines: RequestOverrideLine[];
}

export interface SaveRequestOverride {
  requestHeaderId: number;
  fromDate: string;
  toDate:string;
  notes: string;
  createdBy: number;
  lines: SaveRequestOverrideLine[];
}

export interface SaveRequestOverrideLine {
  requestDetailId: number;
  sessionId: number;
  cuisineId: number;
  locationId: number;
  baseQty: number;
  overrideQty: number;
  isCancelled: boolean;
}
@Injectable({ providedIn: 'root' })
export class RequestOverrideService {
  private baseUrl = `${environment.apiUrl}/RequestOverride`;

  constructor(private http: HttpClient) {}

  getScreen(requestHeaderId: number, fromDate: string, toDate: string): Observable<any> {
    const params = new HttpParams()
      .set('requestHeaderId', requestHeaderId.toString())
      .set('fromDate', fromDate)
      .set('toDate', toDate);

    return this.http.get<any>(`${this.baseUrl}/screen`, { params });
  }

  save(payload: SaveRequestOverride): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save`, payload);
  }
  //  getOverrideList(requestHeaderId: number): Observable<any> {
  //   const params = new HttpParams()
  //     .set('requestHeaderId', requestHeaderId.toString());

  //   return this.http.get<any>(`${this.baseUrl}/list`, { params });
  // }

  deleteOverride(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
  getOverrideList(companyId: number) {
  return this.http.get<any>(`${this.baseUrl}/list?companyId=${companyId}`);
}

getOverrideLines(requestOverrideId: number) {
  return this.http.get<any>(`${this.baseUrl}/lines/${requestOverrideId}`);
}
}