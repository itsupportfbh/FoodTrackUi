import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  private apiUrl = `${environment.apiUrl}/QrCodeRequest`;

  constructor(private http: HttpClient) { }

  // Get Request dropdown
  getRequestDropdown(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetRequestIdDropdown`);
  }

  // Generate QR code (backend returns generated QR)
  generateQR(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/GenerateQr`, data);
  }

  // Send QR code via email
  sendQrEmail(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/SendQrEmail`, data);
  }

  // Add or update QR image
 
}