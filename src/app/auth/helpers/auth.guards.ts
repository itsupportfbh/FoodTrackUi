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

  private readonly LAST_VALID_URL_KEY = 'last_valid_url';
  private readonly MASKED_ROUTE_KEY = 'foodtrack_internal_route';

  constructor(
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private tabSessionService: TabSessionService
  ) {}

  private getStoredUser(): any {
    const currentUser =
      localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

    if (!currentUser) return null;

    try {
      return JSON.parse(currentUser);
    } catch {
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    return (url || '').split('?')[0].toLowerCase();
  }

  private isBlockedUrl(url: string): boolean {
    const cleanUrl = this.normalizeUrl(url);

    return (
      !cleanUrl ||
      cleanUrl === '/' ||
      cleanUrl === '/error' ||
      cleanUrl.includes('/pages/authentication/login-v2') ||
      cleanUrl.includes('/pages/miscellaneous/error') ||
      cleanUrl.includes('/pages/miscellaneous/not-authorized')
    );
  }

  private saveLastValidUrl(url: string): void {
    if (!this.isBlockedUrl(url)) {
      localStorage.setItem(this.LAST_VALID_URL_KEY, url);
      sessionStorage.setItem(this.MASKED_ROUTE_KEY, url);
    }
  }

  private getLastValidUrl(): string {
   const lastRoute = sessionStorage.getItem('foodtrack_last_route');
  const maskedRoute = sessionStorage.getItem('foodtrack_internal_route');
  const lastValidUrl = localStorage.getItem(this.LAST_VALID_URL_KEY);

    if (maskedRoute && !this.isBlockedUrl(maskedRoute)) {
      return maskedRoute;
    }

    if (lastValidUrl && !this.isBlockedUrl(lastValidUrl)) {
      return lastValidUrl;
    }

   
  return lastRoute || lastValidUrl || maskedRoute || '/meal/meal-request';;
  }

  private hasRouteAccess(user: any, url: string): boolean {
    const roleId = Number(user?.roleId || user?.RoleId || user?.role || 0);
    const cleanUrl = this.normalizeUrl(url);

    const isDashboardRoute =
      cleanUrl === '' ||
      cleanUrl === '/' ||
      cleanUrl.startsWith('/dashboard');

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
        cleanUrl.startsWith('/requestoverride/request-override-list') ||
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
      return this._router.parseUrl('/pages/authentication/login-v2');
    }

    const currentUser = this._authenticationService.currentUserValue;
    const storedUser = this.getStoredUser();
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    const user = currentUser || storedUser;
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      return this._router.createUrlTree(['/pages/authentication/login-v2'], {
        queryParams: { returnUrl: this.getLastValidUrl() }
      });
    }

    const currentUrl = state.url;

    if (!this.hasRouteAccess(user, currentUrl)) {
      const lastUrl = this.getLastValidUrl();

      if (lastUrl !== currentUrl) {
        return this._router.parseUrl(lastUrl);
      }

      return this._router.parseUrl('/meal/meal-request');
    }

    this.saveLastValidUrl(currentUrl);
    return true;
  }
}