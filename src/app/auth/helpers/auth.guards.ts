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

    // Login check
    if (!currentUser) {
      this._router.navigate(['/pages/authentication/login-v2'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Role check
    if (route.data.roles && route.data.roles.indexOf(currentUser.role) === -1) {
      this._router.navigate(['/pages/miscellaneous/not-authorized']);
      return false;
    }

    return true;
  }
}