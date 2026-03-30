import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { SessionApiUrls } from 'Urls/SessionApiUrls';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

   private url = environment.apiUrl;
     constructor(private http: HttpClient) { }
   
   
   
        getSession() {
      return this.http.get<any>(`${environment.apiUrl}${SessionApiUrls.GetAllSession}`);
    }
  
    getSessionById(id: number) {
      return this.http.get<any>(`${environment.apiUrl}${SessionApiUrls.GetSessionById}?id=${id}`);
    }
  
    insertSession(data: any) {
      return this.http.post<any>(`${environment.apiUrl}${SessionApiUrls.CreateSession}`, data);
    }
  
    updateSession(data: any) {
      return this.http.put<any>(`${environment.apiUrl}${SessionApiUrls.UpdateSession}`, data);
    }
  
    deleteSession(id: number) {
      return this.http.delete<any>(`${environment.apiUrl}${SessionApiUrls.DeleteSession}?id=${id}`);
    }
}
