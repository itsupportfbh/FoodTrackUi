import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'app/auth/service';
import { TabSessionService } from 'app/services/tab-session.service';


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

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const email = (this.loginForm.value.email || '').trim();
    const password = this.loginForm.value.password || '';

    this._authenticationService.login(email, password, this.rememberMe).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response?.success && response?.data) {
          if (this.rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
          } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
          }

          this._tabSessionService.resetTabSession();
          this._router.navigateByUrl(this.returnUrl || '/dashboard').then(() => {
            // window.location.reload();
          });
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

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
    const rememberedPassword = localStorage.getItem('rememberedPassword') || '';

    this.loginForm = this._formBuilder.group({
      email: [rememberedEmail, [Validators.required, Validators.email]],
      password: [rememberedPassword, Validators.required]
    });

    this.rememberMe = !!rememberedEmail;
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this._tabSessionService.isDuplicateBlocked()) {
      // Swal.fire({
      //   icon: 'warning',
      //   title: 'Duplicate Tab Not Allowed',
      //   text: 'Application is already open in another tab.'
      // });
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