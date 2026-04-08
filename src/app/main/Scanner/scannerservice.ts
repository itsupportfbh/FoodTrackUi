import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import { SaveQrCodeRequestModel } from './qrgenerate/qrgenerate.component';

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
    return this.http.post<any>(`${this.apiUrl}/GenerateUniqueQrs`, data);
  }

  // Send QR code via email
  sendQrEmail(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/SendQrEmail`, data);
  }

  // Add or update QR image
  addOrUpdateQr(model: SaveQrCodeRequestModel): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/AddUpdateQrWithImages`, model);
}
getallQR(data: any): Observable<any> {
    let params = new HttpParams()
      .set('userId', data.userId?.toString() || '0')
      .set('companyId', data.companyId?.toString() || '0')
      .set('isAdmin', data.isAdmin ? 'true' : 'false');

    return this.http.get<any>(`${this.apiUrl}/GetAllQRList`, { params });
  }
 
 getQrImageDetailsByRequestId(id: number): Observable<any> {
  const url = `${this.apiUrl}/GetQrDetailsByRequestId?requestId=${id}`;
  console.log('DOWNLOAD API URL:', url);
  return this.http.get<any>(url);
}


downloadQrZip(qrCodeRequestId: number): Observable<Blob> {
  return this.http.get(
    `${this.apiUrl}/DownloadQrZip`,
    {
      params: { qrcoderequestid: String(qrCodeRequestId) },
      responseType: 'blob'
    }
  );
}
  deleteQR(id: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eleteQR/${id}?userId=${userId}`);
  }

    // Validate scanned QR code
    validateScanAsync(UniqueCode: string, RequestId: number, companyId: number): Observable<any> {
    debugger;
    return this.http.get<any>(`${this.apiUrl}/ValidateScan?UniqueCode=${UniqueCode}&RequestId=${RequestId}&CompanyId=${companyId}`);
  }
  
}