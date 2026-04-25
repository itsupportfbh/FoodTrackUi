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

  constructor(private http: HttpClient) {}

  getRequestDropdown(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetRequestIdDropdown`);
  }

  generateQR(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/GenerateUniqueQrs`, data);
  }

  sendQrEmail(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/SendQrEmail`, data);
  }

  addOrUpdateQr(model: SaveQrCodeRequestModel): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/AddUpdateQrWithImages`, model);
  }

  getallQR(data: any): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId?.toString() || '0')
      .set('companyId', data.companyId?.toString() || '0')
      .set('isAdmin', data.isAdmin ? 'true' : 'false');

    return this.http.get<any>(`${this.apiUrl}/GetAllQRList`, { params });
  }

  getQrImageDetailsByRequestId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetQrDetailsByRequestId`, {
      params: { requestId: String(id) }
    });
  }

  downloadQrZip(qrCodeRequestId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/DownloadQrZip`, {
      params: { qrcoderequestid: String(qrCodeRequestId) },
      responseType: 'blob'
    });
  }

  deleteQR(id: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/DeleteQR/${id}?userId=${userId}`);
  }

  validateScanAsync(UniqueCode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ValidateScan?UniqueCode=${UniqueCode}`);
  }

  submitQrApproval(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit-qr-approval`, payload);
  }

  approveQrRequest(id: number, approvedBy: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approve-qr-request/${id}`, approvedBy);
  }

  rejectQrRequest(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reject-qr-request/${id}`, payload);
  }

  getQrTargetUsers(
    companyId: number,
    planType: string,
    cuisineId: number,
    count: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('companyId', String(companyId || 0))
      .set('planType', planType || '')
      .set('cuisineId', String(cuisineId || 0))
      .set('count', String(count || 0));

    return this.http.get<any>(`${this.apiUrl}/GetQrTargetUsers`, { params });
  }
}