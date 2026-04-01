import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CoreConfigService } from '@core/services/config.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'app/auth/service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  public coreConfig: any;
  public forgotPasswordForm: UntypedFormGroup;
  public submitted = false;
  public mode = 'password';

  private _unsubscribeAll: Subject<any>;

  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private authService: AuthenticationService
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
    return this.forgotPasswordForm.controls;
  }

  get promptText(): string {
    return this.mode === 'username'
      ? 'Username sent to your email, please check and proceed further.'
      : 'Reset link sent to your email, please check and proceed further.';
  }

  ngOnInit(): void {
    const queryMode = this._route.snapshot.queryParamMap.get('mode');
    this.mode = (queryMode || 'password').toLowerCase();

    if (this.mode !== 'username' && this.mode !== 'password') {
      this.mode = 'password';
    }

    this.forgotPasswordForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      mode: [this.mode]
    });

    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Sent!',
          text: res?.message || this.promptText,
          confirmButtonColor: '#0e3a4c',
          showConfirmButton: false,
          timer: 2000
        });

        setTimeout(() => {
          this._router.navigateByUrl('/pages/authentication/login-v2');
        }, 1000);
      },
      error: (err) => {
        let errorMessage = 'Something went wrong!';

        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.status) {
          errorMessage = `Error ${err.status}: ${err.statusText}`;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}