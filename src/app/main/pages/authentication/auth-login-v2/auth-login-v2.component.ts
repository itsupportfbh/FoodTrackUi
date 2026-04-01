import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'app/auth/service';

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
    private _authenticationService: AuthenticationService
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

    this._authenticationService.login(email, password).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Login response =>', response);

        if (response?.success && response?.data) {
          localStorage.setItem('currentUser', JSON.stringify(response.data));

          if (this.rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
          } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
          }

          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: response?.message || 'Welcome'
          }).then(() => {
            // role based redirect
            if (response?.data?.roleId === 1) {
              this._router.navigate(['/home']);
            } else {
              this._router.navigate(['/home']);
            }
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
        console.error('Login error =>', err);

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

    // default return url not root
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/catering';

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