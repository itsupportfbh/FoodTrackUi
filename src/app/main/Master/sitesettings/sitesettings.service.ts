import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SitesettingsService {

  private apiUrl = `${environment.apiUrl}/SiteSettings`;
  
    constructor(private http: HttpClient) {}
  
    getAllSiteSettings() {
      return this.http.get(`${this.apiUrl}/GetAllSiteSettings`);
    }

   getSiteSettingsById(id: number) {
    return this.http.get(`${this.apiUrl}/GetSitesettingsbyid`);
  }

  saveSiteSettings(payload: any) {
    return this.http.post(`${this.apiUrl}/AddUpdateSiteSettings`, payload);
  }

  deleteSiteSettings(id: number, userId: any) {
  return this.http.delete(`${this.apiUrl}/DeleteSiteSettings?id=${id}&userId=${userId}`);
}
}
