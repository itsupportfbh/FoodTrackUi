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

  private hasRouteAccess(roleId: number, url: string): boolean {
    const cleanUrl = (url || '').toLowerCase();

    if (roleId === 1) {
      return (
        cleanUrl.startsWith('/dashboard') ||
        cleanUrl.startsWith('/master') ||
        cleanUrl.startsWith('/catering/companymaster') ||
        cleanUrl.startsWith('/scanner/listqr') ||
        cleanUrl.startsWith('/catering/reports')
      );
    }

    if (roleId === 2) {
      return (
        cleanUrl.startsWith('/dashboard') ||
        cleanUrl.startsWith('/requestoverride/request-override-list') ||
        cleanUrl.startsWith('/catering/request')||
        cleanUrl.startsWith('/requestoverride/request-override')
      );
    }

    if (roleId === 3) {
      return cleanUrl.startsWith('/scanner/scanner');
    }

    return false;
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

    const roleId = Number(user?.roleId || user?.RoleId || user?.role || 0);

    if (!this.hasRouteAccess(roleId, state.url)) {
      this._router.navigate(['/pages/miscellaneous/not-authorized']);
      return false;
    }

    return true;
  }
}