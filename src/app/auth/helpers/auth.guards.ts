import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { AuthenticationService } from 'app/auth/service';
import { TabSessionService } from 'app/services/tab-session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _authenticationService: AuthenticationService,
      private tabSessionService: TabSessionService
  ) { }

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

  private hasRouteAccess(user: any, url: string): boolean {
    const roleId = Number(user?.roleId || user?.RoleId || user?.role || 0);
    const cleanUrl = (url || '').toLowerCase();
    const isDashboardRoute =
      cleanUrl === '' || cleanUrl === '/' || cleanUrl.startsWith('/dashboard');

    if (roleId === 1) {
      return (
        isDashboardRoute ||
        cleanUrl.startsWith('/master') ||
        cleanUrl.startsWith('/catering/companymaster') ||
        cleanUrl.startsWith('/scanner/listqr') ||
        cleanUrl.startsWith('/catering/reports') ||
        cleanUrl.startsWith('/scanner/qrgenerate') ||
        cleanUrl.startsWith('/users/users-list') ||
        cleanUrl.startsWith('/users/users-create') ||
        cleanUrl.startsWith('/menu/menu')
      );
    }

    if (roleId === 2) {
      return (
        cleanUrl.startsWith('requestoverride/Request-override-list') ||
        cleanUrl.startsWith('/catering/request') ||
        cleanUrl.startsWith('/requestoverride/request-override') ||
        cleanUrl.startsWith('/catering/reports') ||
        cleanUrl.startsWith('/users/users-list') ||
        cleanUrl.startsWith('/users/users-create') ||
        cleanUrl.startsWith('/menu/menu') ||
        cleanUrl.startsWith('/scanner/qrgenerate') ||
        cleanUrl.startsWith('/scanner/listqr') ||
        cleanUrl.startsWith('/meal/meal-request') ||
        cleanUrl.startsWith('/meal/show-qr')
      );
    }

    if (roleId === 3) {
      return cleanUrl.startsWith('/scanner/scanner');
    }

    if (roleId === 4) {
      return (
        // isDashboardRoute ||
        // cleanUrl.startsWith('requestoverride/Request-override-list') ||
        // cleanUrl.startsWith('/catering/request') ||
        // cleanUrl.startsWith('/requestoverride/request-override') ||
        // cleanUrl.startsWith('/catering/reports') ||
        // cleanUrl.startsWith('/users/users-list') ||
        // cleanUrl.startsWith('/users/users-create') ||
        // cleanUrl.startsWith('/menu/menu') ||
        // cleanUrl.startsWith('/scanner/qrgenerate') ||
        // cleanUrl.startsWith('/scanner/listqr') ||
        cleanUrl.startsWith('/meal/meal-request') ||
        cleanUrl.startsWith('/meal/show-qr')
      );
    }
    return false;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
      if (this.tabSessionService.isDuplicateBlocked()) {
    return this._router.createUrlTree(['/pages/authentication/login-v2']);
  }
    const currentUser = this._authenticationService.currentUserValue;
    const storedUser = this.getStoredUser();
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    const user = currentUser || storedUser;
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      return this._router.createUrlTree(['/pages/authentication/login-v2'], {
        queryParams: { returnUrl: state.url }
      });
    }

    if (!this.hasRouteAccess(user, state.url)) {
      return this._router.createUrlTree(['/error']);
    }

    return true;
  }
}
