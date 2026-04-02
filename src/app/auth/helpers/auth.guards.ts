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

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this._authenticationService.currentUserValue;
    const storedCurrentUser = localStorage.getItem('currentUser');
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const isLoggedIn = !!currentUser || !!storedCurrentUser || !!accessToken || !!token;

    if (!isLoggedIn) {
      this._router.navigate(['/pages/authentication/login-v2'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    if (route.data.roles && currentUser && route.data.roles.indexOf(currentUser.role) === -1) {
      this._router.navigate(['/pages/miscellaneous/not-authorized']);
      return false;
    }

    return true;
  }
}