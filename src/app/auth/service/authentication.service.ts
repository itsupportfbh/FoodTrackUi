import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUser: Observable<any>;
  private currentUserSubject: BehaviorSubject<any>;

  constructor(private _http: HttpClient) {
    const savedUser =
      localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

    this.currentUserSubject = new BehaviorSubject<any>(
      savedUser ? JSON.parse(savedUser) : null
    );

    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string, rememberMe: boolean = true): Observable<any> {
    const url = `${environment.apiUrl}/Auth/Login`;

    return this._http.post<any>(url, { email, password }).pipe(
      map((response: any) => {
        if (response?.success && response?.data) {
          const storage = rememberMe ? localStorage : sessionStorage;
          const otherStorage = rememberMe ? sessionStorage : localStorage;

          otherStorage.removeItem('currentUser');
          otherStorage.removeItem('token');
          otherStorage.removeItem('id');
          otherStorage.removeItem('companyId');
          otherStorage.removeItem('email');
          otherStorage.removeItem('username');

          storage.setItem('currentUser', JSON.stringify(response.data));
          storage.setItem('token', response.data.token || '');
          storage.setItem('id', String(response.data.id || ''));
          storage.setItem('companyId', String(response.data.companyId || ''));
          storage.setItem('email', response.data.email || '');
          storage.setItem('username', response.data.username || '');

          this.currentUserSubject.next(response.data);
        }

        return response;
      })
    );
  }

  forgotPassword(payload: { email: string; mode: string }): Observable<any> {
    return this._http.post(`${environment.apiUrl}/Auth/ForgotPassword`, payload);
  }

  resetPassword(payload: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<any> {
    return this._http.post(`${environment.apiUrl}/Auth/ResetPassword`, payload);
  }

  changePassword(payload: any): Observable<any> {
    return this._http.post(`${environment.apiUrl}/Auth/ChangePassword`, payload);
  }

  logout(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    localStorage.clear();
    sessionStorage.clear();

    if (rememberedEmail && rememberedPassword) {
      localStorage.setItem('rememberedEmail', rememberedEmail);
      localStorage.setItem('rememberedPassword', rememberedPassword);
    }

    this.currentUserSubject.next(null);
  }
}