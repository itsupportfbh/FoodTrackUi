import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'app/auth/service';
import { TabSessionService } from 'app/services/tab-session.service';
import { environment } from 'environments/environment';
import { MenuItem, MenuService } from 'app/main/menu/menuService/menu.service';


@Component({
  selector: 'app-auth-login-v2',
  templateUrl: './auth-login-v2.component.html',
  styleUrls: ['./auth-login-v2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginV2Component implements OnInit, OnDestroy {
  public coreConfig: any;
  public loginForm: UntypedFormGroup;
  public loading = false;
  public submitted = false;
  public returnUrl: string;
  public error = '';
  public passwordTextType = false;
  public rememberMe = false;

  public todayMenu: MenuItem[] = [];
  public loadingMenu = false;
  public downloadingPdf = false;
public downloadingMonthlyPdf = false;
  private readonly loginUrl = `${environment.apiUrl}/Auth/Login`;
  private _unsubscribeAll: Subject<any>;

  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private _tabSessionService: TabSessionService,
    private _menuService: MenuService
  ) {
    this._unsubscribeAll = new Subject();

    this._coreConfigService.config = {
      layout: {
        navbar: { hidden: true },
        menu: { hidden: true },
        footer: { hidden: true },
        customizer: false,
        enableLocalStorage: false
      }
    };
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordTextType(): void {
    this.passwordTextType = !this.passwordTextType;
  }

  private getDefaultRouteByRole(roleId: number): string {
    if (roleId === 1) {
      return '/';
    }

    if (roleId === 2) {
      return '/catering/request';
    }

    if (roleId === 3) {
      return '/scanner/scanner';
    }

    return '/';
  }

  private isAllowedReturnUrl(roleId: number, url: string): boolean {
    const cleanUrl = (url || '').toLowerCase();
    const isDashboardRoute =
      cleanUrl === '' || cleanUrl === '/' || cleanUrl.startsWith('/dashboard');

    if (!cleanUrl) {
      return false;
    }

    if (roleId === 1) {
      return (
        isDashboardRoute ||
        cleanUrl.startsWith('/master') ||
        cleanUrl.startsWith('/catering/companymaster') ||
        cleanUrl.startsWith('/scanner/listqr') ||
        cleanUrl.startsWith('/catering/reports')
      );
    }

    if (roleId === 2) {
      return (
        isDashboardRoute ||
        cleanUrl.startsWith('/requestoverride/request-override-list') ||
        cleanUrl.startsWith('/catering/request')
      );
    }

    if (roleId === 3) {
      return cleanUrl.startsWith('/scanner/scanner');
    }

    return false;
  }

  private setAuthDataToLocalStorage(responseData: any, email: string): void {
    const token =
      responseData?.token ||
      responseData?.Token ||
      responseData?.accessToken ||
      responseData?.jwtToken ||
      '';

    const userId =
      responseData?.id ||
      responseData?.Id ||
      responseData?.userId ||
      responseData?.UserId ||
      0;

    const companyId =
      responseData?.companyId ||
      responseData?.CompanyId ||
      0;

    const roleId =
      responseData?.roleId ||
      responseData?.RoleId ||
      responseData?.role ||
      0;

    const currentUser = {
      ...responseData,
      id: Number(userId || 0),
      companyId: Number(companyId || 0),
      roleId: Number(roleId || 0),
      email: responseData?.email || responseData?.Email || email
    };

    if (token) {
      localStorage.setItem('token', token);
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('id', String(currentUser.id || ''));
    localStorage.setItem('companyId', String(currentUser.companyId || ''));
    localStorage.setItem('email', currentUser.email || email || '');
    localStorage.setItem('roleId', String(currentUser.roleId || ''));
    localStorage.setItem('isLoggedIn', 'true');
  }

  private handleRememberMe(email: string, password: string): void {
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const email = (this.loginForm.value.email || '').trim();
    const password = this.loginForm.value.password || '';

    this._authenticationService.clearAuthData();

    this._authenticationService.login(email, password, this.rememberMe).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response?.success && response?.data) {
          this.handleRememberMe(email, password);
          this.setAuthDataToLocalStorage(response.data, email);

          this._tabSessionService.activateCurrentTab();

          const roleId = Number(
            response?.data?.roleId || response?.data?.RoleId || response?.data?.role || 0
          );

          let targetUrl = this.getDefaultRouteByRole(roleId);

          if (this.isAllowedReturnUrl(roleId, this.returnUrl)) {
            targetUrl = this.returnUrl;
          }

          this._router.navigateByUrl(targetUrl);
        } else {
          this.error = response?.message || 'Invalid email or password';

          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: this.error
          });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Invalid email or password';

        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: this.error
        });
      }
    });
  }

  loadTodayMenu(): void {
    this.loadingMenu = true;

    const today = this.formatDate(new Date());

    this._menuService.getMenuByDate(today).subscribe({
      next: (response: any) => {
        this.todayMenu = Array.isArray(response) ? response : (response?.data || []);
        this.loadingMenu = false;
      },
      error: () => {
        this.todayMenu = [];
        this.loadingMenu = false;
      }
    });
  }

  downloadTodayMenuPdf(): void {
    this.downloadingPdf = true;

    const today = this.formatDate(new Date());

    this._menuService.downloadMenuPdf(today).subscribe({
      next: (blob: Blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `Menu_${today}.pdf`;
        a.click();
        window.URL.revokeObjectURL(fileUrl);
        this.downloadingPdf = false;
      },
      error: () => {
        this.downloadingPdf = false;

        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download menu PDF.'
        });
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
    const rememberedPassword = localStorage.getItem('rememberedPassword') || '';

    this.loginForm = this._formBuilder.group({
      email: [rememberedEmail, [Validators.required, Validators.email]],
      password: [rememberedPassword, Validators.required]
    });

    this.rememberMe = !!rememberedEmail;
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '';

    if (this._tabSessionService.isDuplicateBlocked()) {
      this._tabSessionService.clearDuplicateBlockedFlag();
    }

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.coreConfig = config;
      });

    this.loadTodayMenu();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
  downloadMonthlyMenuPdf(): void {
  this.downloadingMonthlyPdf = true;

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  this._menuService.downloadMonthlyMenuPdf(month, year).subscribe({
    next: (blob: Blob) => {
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = `Monthly_Menu_${year}_${('0' + month).slice(-2)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(fileUrl);
      this.downloadingMonthlyPdf = false;
    },
    error: () => {
      this.downloadingMonthlyPdf = false;

      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Unable to download monthly menu PDF.'
      });
    }
  });
}
}