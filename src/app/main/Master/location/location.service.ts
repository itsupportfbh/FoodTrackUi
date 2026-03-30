import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { LocationApiUrls } from 'Urls/LocationApiUrls';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

 private url = environment.apiUrl;
   constructor(private http: HttpClient) { }
 
 
 
      getLocation() {
    return this.http.get<any>(`${environment.apiUrl}${LocationApiUrls.GetAllLocation}`);
  }

  getLocationById(id: number) {
    return this.http.get<any>(`${environment.apiUrl}${LocationApiUrls.GetLocationById}?id=${id}`);
  }

  insertLocation(data: any) {
    return this.http.post<any>(`${environment.apiUrl}${LocationApiUrls.CreateLocation}`, data);
  }

  updateLocation(data: any) {
    return this.http.put<any>(`${environment.apiUrl}${LocationApiUrls.UpdateLocation}`, data);
  }

  deleteLocation(id: number) {
    return this.http.delete<any>(`${environment.apiUrl}${LocationApiUrls.DeleteLocation}?id=${id}`);
  }
}
