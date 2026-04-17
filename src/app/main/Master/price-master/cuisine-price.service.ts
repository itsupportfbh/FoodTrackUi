import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuisinePriceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllCuisinesWithRates(companyId: number, sessionId: number) {
    return this.http.get(
      `${this.apiUrl}/CuisinePrice/all-cuisines-with-rates?companyId=${companyId}&sessionId=${sessionId}`
    );
  }

  saveBulkCuisineRates(payload: any) {
    return this.http.post(`${this.apiUrl}/CuisinePrice/save-bulk`, payload);
  }

  getPriceHistory(companyId: number, sessionId: number, cuisineId: number) {
    return this.http.get(
      `${this.apiUrl}/CuisinePrice/history?companyId=${companyId}&sessionId=${sessionId}&cuisineId=${cuisineId}`
    );
  }
  getPriceList() {
    return this.http.get(`${this.apiUrl}/CuisinePrice/GetPriceList`);
  }
  getCompanies() {
    return this.http.get(`${this.apiUrl}/Company/list`);
  }

  getSessions() {
    return this.http.get(`${this.apiUrl}/Session/GetAllSession`);
  }

  getCuisines() {
    return this.http.get(`${this.apiUrl}/Cuisine/GetCuisines`);
  }

  exportPriceList() {
    return this.http.get(`${this.apiUrl}/PriceMaster/ExportPriceList`, {
      responseType: 'blob'
    });
  }
}