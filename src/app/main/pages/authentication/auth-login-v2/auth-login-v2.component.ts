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
  private readonly loginUrl = `${environment.apiUrl}/Auth/Login`;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private _tabSessionService: TabSessionService
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

    // optional extra values if needed elsewhere
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

    // old auth data clear pannalam
    // but fresh login success aana பிறகு localStorage la manual-ah set pannuvom
    this._authenticationService.clearAuthData();
    this._authenticationService.login(email, password, this.rememberMe).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response?.success && response?.data) {
          // remember me fields மட்டும் checkbox based
          this.handleRememberMe(email, password);

          // remember me false இருந்தாலும் auth data localStorage la save ஆகும்
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

          // Swal.fire({
          //   icon: 'error',
          //   title: 'Login Failed',
          //   text: `${this.error}\nURL: ${this.loginUrl}\nResponse: ${JSON.stringify(response)}`
          // });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Invalid email or password';
        const responseBody = err?.error ? JSON.stringify(err.error) : 'No error body';

        // Swal.fire({
        //   icon: 'error',
        //   title: 'Login Failed',
        //   text: `${this.error}\nURL: ${this.loginUrl}\nResponse: ${responseBody}`
        // });

         Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: this.error
        });
      }
    });
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
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
