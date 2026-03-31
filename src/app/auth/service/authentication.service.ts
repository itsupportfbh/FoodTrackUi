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
    const savedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(savedUser ? JSON.parse(savedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<any> {
    const url = `${environment.apiUrl}/Auth/Login`;
    console.log('Login URL =>', url);
    console.log('Login Payload =>', { email, password });

    return this._http
      .post<any>(url, { email, password })
      .pipe(
        map((response: any) => {
          if (response?.success && response?.data?.token) {
            const user = {
              id: response.data.id,
              companyId: response.data.companyId,
              roleId: response.data.roleId,
              username: response.data.username,
              email: response.data.email,
              isActive: response.data.isActive,
              token: response.data.token,
              role: response.data.role ?? response.data.roleId
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', response.data.token);

            this.currentUserSubject.next(user);
          }

          return response;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    this.currentUserSubject.next(null);
  }
}