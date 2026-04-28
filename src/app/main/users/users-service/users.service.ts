import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface UserMasterPayload {
  id?: number;
  companyId: number;
  roleId?: number | null;
  username: string;
  email: string;
  password: string;
  planType: string;
  cuisineId:number;
  isActive: boolean;
  isDelete: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/UserMaster`;

  constructor(private http: HttpClient) {}

  getAllUsers(userId: number, roleId: number, companyId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/GetAllUserMaster?userId=${userId}&roleId=${roleId}&companyId=${companyId}`
    );
  }

  getUserById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetUserMasterById?id=${id}`);
  }

  createUser(payload: UserMasterPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/CreateUserMaster`, payload);
  }

  updateUser(payload: UserMasterPayload): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/UpdateUserMaster`, payload);
  }

  deleteUser(id: number, updatedBy: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DeleteUserMaster?id=${id}&updatedBy=${updatedBy}`
    );
  }

  getRoles(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetRoles`);
  }

downloadUserTemplate(companyId: number): Observable<Blob> {
  return this.http.get(
    `${environment.apiUrl}/UserMaster/DownloadUserTemplate?companyId=${companyId}`,
    { responseType: 'blob' }
  );
}

  bulkUploadUsers(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/BulkUploadUsers`, formData);
  }

  getCuisines(companyID : number): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/UserMaster/GetAllCuisine?companyId=${companyID}`);
}


}