import { Component, OnDestroy, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreConfigService } from '@core/services/config.service';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'app/auth/service';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ResetPasswordComponent implements OnInit, OnDestroy, AfterViewInit {
  public coreConfig: any;
  public resetPasswordForm: UntypedFormGroup;
  public submitted = false;
  public passwordTextType = false;
  public confirmPasswordTextType = false;

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
    return this.resetPasswordForm.controls;
  }

  ngOnInit(): void {
    const email = this._route.snapshot.queryParamMap.get('email') || '';
    const token = this._route.snapshot.queryParamMap.get('token') || '';

    this.resetPasswordForm = this._formBuilder.group({
      email: [email, [Validators.required, Validators.email]],
      token: [token, Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
    });
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  togglePassword(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.passwordTextType = !this.passwordTextType;
    } else {
      this.confirmPasswordTextType = !this.confirmPasswordTextType;
    }

    setTimeout(() => {
      feather.replace();
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.resetPasswordForm.invalid) {
      return;
    }

    const formValue = this.resetPasswordForm.value;

    if (formValue.newPassword !== formValue.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.authService.resetPassword(formValue).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res?.message || 'Password reset successfully',
          confirmButtonColor: '#0e3a4c'
        }).then(() => {
          this._router.navigateByUrl('/pages/authentication/login-v2');
        });
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