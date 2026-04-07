import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthenticationService } from 'app/auth/service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _authenticationService: AuthenticationService
  ) {}

  private getStoredUser(): any {
    const currentUser =
      localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

    if (!currentUser) {
      return null;
    }

    try {
      return JSON.parse(currentUser);
    } catch {
      return null;
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this._authenticationService.currentUserValue;
    const storedUser = this.getStoredUser();
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    const user = currentUser || storedUser;
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      this._router.navigate(['/pages/authentication/login-v2'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    if (route.data.roles && user && route.data.roles.indexOf(user.role) === -1) {
      this._router.navigate(['/pages/miscellaneous/not-authorized']);
      return false;
    }

    return true;
  }
}