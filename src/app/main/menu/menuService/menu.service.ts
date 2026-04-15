import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface MenuRow {
  date: string;
  sessionName: string;
  cuisineName: string;
  setName: string;
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  notes: string;
}

export interface SaveMenuUploadRequest {
  menuMonth: number;
  menuYear: number;
  createdBy?: number | null;
  rows: MenuRow[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveMenu(payload: SaveMenuUploadRequest): Observable<any> {
    return this.http.post(`${this.url}/Menu/save`, payload);
  }

  getMenuByMonthYear(month: number, year: number): Observable<any> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get(`${this.url}/Menu/list`, { params });
  }
}