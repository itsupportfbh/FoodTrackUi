import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'app/auth/service';
import Swal from 'sweetalert2';

declare const feather: any;

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, AfterViewInit {
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  errorMessage = '';
  isSaving = false;
  currentUser: any = null;

  form = {
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  checks = {
    minLength: false,
    upperCase: false,
    number: false,
    special: false,
    matches: false,
    differentFromOld: false
  };

  passedCount = 0;
  strengthLabel = 'Weak';
  strengthPercent = 0;

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserFromLocalStorage();
    this.calculateStrength();
  }

  ngAfterViewInit(): void {
    this.loadIcons();
  }

  loadIcons(): void {
    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    });
  }

  loadUserFromLocalStorage(): void {
    try {
      const currentUserRaw = localStorage.getItem('currentUser');

      if (currentUserRaw) {
        this.currentUser = JSON.parse(currentUserRaw);
        this.form.email = this.currentUser?.email || '';
      } else {
        this.form.email = '';
      }

      // security reason -> old password should never come from localStorage
      this.form.oldPassword = '';
    } catch (error) {
      console.error('Error reading localStorage:', error);
      this.form.email = '';
      this.form.oldPassword = '';
    }
  }

  toggleOldPassword(): void {
    this.showOldPassword = !this.showOldPassword;
    this.loadIcons();
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
    this.loadIcons();
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.loadIcons();
  }

  onPasswordChange(): void {
    this.calculateStrength();
  }

  calculateStrength(): void {
    const password = this.form.newPassword || '';

    this.checks = {
      minLength: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      matches: password.length > 0 && password === this.form.confirmPassword,
      differentFromOld: password.length > 0 && password !== this.form.oldPassword
    };

    this.passedCount = Object.values(this.checks).filter(Boolean).length;
    this.strengthPercent = (this.passedCount / 6) * 100;

    if (this.passedCount <= 2) {
      this.strengthLabel = 'Weak';
    } else if (this.passedCount <= 4) {
      this.strengthLabel = 'Medium';
    } else {
      this.strengthLabel = 'Strong';
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.calculateStrength();

    if (!this.currentUser?.id || !this.currentUser?.companyId) {
      this.errorMessage = 'User session not found';
      return;
    }

    if (!this.form.email) {
      this.errorMessage = 'Email is required';
      return;
    }

    if (!this.form.oldPassword) {
      this.errorMessage = 'Old password is required';
      return;
    }

    if (!this.form.newPassword || !this.form.confirmPassword) {
      this.errorMessage = 'Please enter new password and confirm password';
      return;
    }

    if (!this.checks.minLength) {
      this.errorMessage = 'Password must be at least 8 characters';
      return;
    }

    if (!this.checks.upperCase) {
      this.errorMessage = 'Password must contain at least 1 uppercase letter';
      return;
    }

    if (!this.checks.number) {
      this.errorMessage = 'Password must contain at least 1 number';
      return;
    }

    if (!this.checks.special) {
      this.errorMessage = 'Password must contain at least 1 special character';
      return;
    }

    if (!this.checks.differentFromOld) {
      this.errorMessage = 'New password must be different from old password';
      return;
    }

    if (!this.checks.matches) {
      this.errorMessage = 'New password and confirm password do not match';
      return;
    }

    const payload = {
      userId: this.currentUser.id,
      companyId: this.currentUser.companyId,
      email: this.form.email,
      oldPassword: this.form.oldPassword,
      newPassword: this.form.newPassword,
      confirmPassword: this.form.confirmPassword
    };

    this.isSaving = true;

    this.authService.changePassword(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res?.isSuccess) {
          this.form.oldPassword = '';
          this.form.newPassword = '';
          this.form.confirmPassword = '';
          this.errorMessage = '';
          this.calculateStrength();

          Swal.fire({
            icon: 'success',
            title: 'Password Updated',
            text: res?.message || 'Your password has been changed successfully',
            confirmButtonText: 'OK'
          });
          this.goTologout();
        } else {
          this.errorMessage = res?.message || 'Password change failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error?.Message ||
          'Unable to change password. Please try again.';
      }
    });
  }

  resetForm(): void {
    this.form.oldPassword = '';
    this.form.newPassword = '';
    this.form.confirmPassword = '';
    this.errorMessage = '';
    this.calculateStrength();
  }


  Cancel(){
    this.router.navigate(['/'])
  }

  goTologout(){
      this.router.navigate(['/pages/authentication/login-v2']);
  }
} 
