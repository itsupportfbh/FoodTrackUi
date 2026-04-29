import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { LocationService } from '../../location/location.service';
import { MealRequestService } from '../meal-request-service/meal-request.service';

@Component({
  selector: 'app-meal-request',
  templateUrl: './meal-request.component.html',
  styleUrls: ['./meal-request.component.scss']
})
export class MealRequestComponent implements OnInit {
  fromDate = '';
  toDate = '';
  locationId: number | null = null;

  allowedFromDate = '';
  allowedToDate = '';

  locations: any[] = [];
  existingMealRequests: any[] = [];

  isSubmitting = false;
  isMealAllowed = false;
  eligibilityMessage = '';

  currentUser: any;
  companyId = 0;
  userId = 0;

  constructor(
    private _locationService: LocationService,
    private _mealRequestService: MealRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.checkMealEligibility();
  }

  loadCurrentUser(): void {
    const storedUser =
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('currentUser');

    if (!storedUser) {
      this.companyId = 0;
      this.userId = 0;
      return;
    }

    try {
      this.currentUser = JSON.parse(storedUser);

      this.companyId = Number(
        this.currentUser.companyId ||
          this.currentUser.CompanyId ||
          this.currentUser.orgId ||
          this.currentUser.OrgId ||
          0
      );

      this.userId = Number(
        this.currentUser.id ||
          this.currentUser.Id ||
          this.currentUser.userId ||
          this.currentUser.UserId ||
          0
      );
    } catch {
      this.companyId = 0;
      this.userId = 0;
    }
  }

  checkMealEligibility(): void {
    if (!this.companyId || !this.userId) {
      this.isMealAllowed = false;
      this.eligibilityMessage = 'Login user details not found. Please login again.';
      this.disableFormValues();
      return;
    }

    this._mealRequestService
      .checkMealRequestEligibility(this.companyId, this.userId)
      .subscribe({
        next: (res: any) => {
          const data = res?.data;

          this.isMealAllowed =
            res?.status === true &&
            (data?.isAllowed === true || data?.IsAllowed === true);

          if (!this.isMealAllowed) {
            this.eligibilityMessage =
              res?.message ||
              data?.message ||
              data?.Message ||
              'No order found for your account. You cannot select a meal location.';

            this.disableFormValues();

            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              text: this.eligibilityMessage,
              confirmButtonText: 'OK'
            });

            return;
          }

          this.eligibilityMessage = '';

          this.allowedFromDate = this.formatDateOnly(
            data?.minFromDate || data?.MinFromDate
          );

          this.allowedToDate = this.formatDateOnly(
            data?.maxToDate || data?.MaxToDate
          );

          const today = this.getTodayDateString();

          if (
            this.allowedFromDate &&
            this.allowedToDate &&
            today >= this.allowedFromDate &&
            today <= this.allowedToDate
          ) {
            this.fromDate = today;
            this.toDate = today;
          } else {
            this.fromDate = this.allowedFromDate;
            this.toDate = this.allowedFromDate;
          }

          this.loadLocation();
          this.loadExistingMealRequests();
        },
        error: () => {
          this.isMealAllowed = false;
          this.eligibilityMessage = 'Unable to check meal order details.';
          this.disableFormValues();
          Swal.fire('Error', this.eligibilityMessage, 'error');
        }
      });
  }

  loadLocation(): void {
    this._locationService.getLocation().subscribe({
      next: (res: any) => {
        this.locations = res?.data || res?.result || res || [];
      },
      error: () => {
        this.locations = [];
        Swal.fire('Error', 'Unable to load locations.', 'error');
      }
    });
  }

  loadExistingMealRequests(): void {
    if (!this.companyId || !this.userId) {
      return;
    }

    this._mealRequestService
      .getAllMealRequests(this.companyId, this.userId)
      .subscribe({
        next: (res: any) => {
          this.existingMealRequests = res?.data || res?.result || res || [];
          this.bindLocationByDate(this.fromDate);
        },
        error: () => {
          this.existingMealRequests = [];
        }
      });
  }

  onFromDateChange(): void {
    if (!this.fromDate) {
      return;
    }

    if (this.allowedFromDate && this.fromDate < this.allowedFromDate) {
      Swal.fire(
        'Warning',
        `From Date should not be before ${this.allowedFromDate}.`,
        'warning'
      );
      this.fromDate = this.allowedFromDate;
    }

    if (this.allowedToDate && this.fromDate > this.allowedToDate) {
      Swal.fire(
        'Warning',
        `From Date should not be after ${this.allowedToDate}.`,
        'warning'
      );
      this.fromDate = this.allowedToDate;
    }

    if (!this.toDate || this.toDate < this.fromDate) {
      this.toDate = this.fromDate;
    }

    this.bindLocationByDate(this.fromDate);
  }

  onToDateChange(): void {
    if (!this.toDate) {
      return;
    }

    if (this.toDate < this.fromDate) {
      Swal.fire('Warning', 'To Date should not be before From Date.', 'warning');
      this.toDate = this.fromDate;
      return;
    }

    if (this.allowedToDate && this.toDate > this.allowedToDate) {
      Swal.fire(
        'Warning',
        `To Date should not be after ${this.allowedToDate}.`,
        'warning'
      );
      this.toDate = this.allowedToDate;
    }
  }

  bindLocationByDate(dateValue: string): void {
    if (!dateValue || !this.existingMealRequests.length) {
      this.locationId = null;
      return;
    }

    const selectedDate = this.toDateOnly(dateValue);

    const matchedRequest = this.existingMealRequests.find((item: any) => {
      const from = this.toDateOnly(item.fromDate || item.FromDate);
      const to = this.toDateOnly(item.toDate || item.ToDate);

      return selectedDate >= from && selectedDate <= to;
    });

    if (matchedRequest) {
      this.locationId = Number(
        matchedRequest.locationId || matchedRequest.LocationId
      );
    } else {
      this.locationId = null;
    }
  }

  onSubmit(): void {
    if (!this.isMealAllowed) {
      Swal.fire(
        'Warning',
        this.eligibilityMessage || 'Ungaluku order podala.',
        'warning'
      );
      return;
    }

    if (!this.fromDate || !this.toDate || !this.locationId) {
      Swal.fire(
        'Warning',
        'Please select From Date, To Date and Location.',
        'warning'
      );
      return;
    }

    if (this.fromDate > this.toDate) {
      Swal.fire(
        'Warning',
        'From Date should not be greater than To Date.',
        'warning'
      );
      return;
    }

    if (
      this.allowedFromDate &&
      this.allowedToDate &&
      (this.fromDate < this.allowedFromDate || this.toDate > this.allowedToDate)
    ) {
      Swal.fire(
        'Warning',
        `Date should be between ${this.allowedFromDate} and ${this.allowedToDate}.`,
        'warning'
      );
      return;
    }

    if (!this.companyId || !this.userId) {
      Swal.fire(
        'Error',
        'Login user details not found. Please login again.',
        'error'
      );
      return;
    }

    const payload = {
      id: 0,
      companyId: this.companyId,
      userId: this.userId,
      fromDate: this.fromDate,
      toDate: this.toDate,
      locationId: Number(this.locationId),
      createdBy: this.userId,
      updatedBy: null
    };

    this.isSubmitting = true;

    this._mealRequestService.saveMealRequest(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        if (res?.status === true) {
          Swal.fire(
            'Success',
            res.message || 'Meal request saved successfully.',
            'success'
          );

          this.loadExistingMealRequests();
          this.resetToAllowedDate();
          this.gotoshowqr();
        } else {
          Swal.fire(
            'Warning',
            res?.message || 'Unable to save meal request.',
            'warning'
          );
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;

        Swal.fire(
          'Error',
          err?.error?.message ||
            'Something went wrong while saving meal request.',
          'error'
        );
      }
    });
  }

  onCancel(): void {
    if (!this.isMealAllowed) {
      return;
    }

    this.resetToAllowedDate();
  }

  resetToAllowedDate(): void {
    const today = this.getTodayDateString();

    if (
      this.allowedFromDate &&
      this.allowedToDate &&
      today >= this.allowedFromDate &&
      today <= this.allowedToDate
    ) {
      this.fromDate = today;
      this.toDate = today;
    } else {
      this.fromDate = this.allowedFromDate;
      this.toDate = this.allowedFromDate;
    }

    this.bindLocationByDate(this.fromDate);
  }

  disableFormValues(): void {
    this.fromDate = '';
    this.toDate = '';
    this.locationId = null;
    this.locations = [];
    this.allowedFromDate = '';
    this.allowedToDate = '';
  }

  gotoshowqr(): void {
    this.router.navigate(['/meal/show-qr']);
  }

  getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  formatDateOnly(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  toDateOnly(value: string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}