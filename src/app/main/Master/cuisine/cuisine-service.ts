import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuisineService {
  private apiUrl = `${environment.apiUrl}/Cuisine`;

  constructor(private http: HttpClient) {}

  getAllCuisine() {
    return this.http.get(`${this.apiUrl}/GetCuisines`);
  }

  getCuisineById(id: number) {
    return this.http.get(`${this.apiUrl}/GetCuisineById/${id}`);
  }

  saveCuisine(payload: any) {
    return this.http.post(`${this.apiUrl}/SaveCuisine`, payload);
  }

  deleteCuisine(id: number, userId: any) {
    return this.http.delete(`${this.apiUrl}/DeleteCuisine/${id}?userId=${userId}`);
  }
}