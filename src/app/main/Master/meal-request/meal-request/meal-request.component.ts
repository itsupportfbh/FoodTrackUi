import { Component, OnInit } from '@angular/core';
import { LocationService } from '../../location/location.service';
import Swal from 'sweetalert2';
import { MealRequestService } from '../meal-request-service/meal-request.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-meal-request',
  templateUrl: './meal-request.component.html',
  styleUrls: ['./meal-request.component.scss']
})
export class MealRequestComponent implements OnInit {
  fromDate = '';
  toDate = '';
  locationId: number | null = null;

  locations: any[] = [];
  existingMealRequests: any[] = [];

  isSubmitting = false;

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

    const today = this.getTodayDateString();
    this.fromDate = today;
    this.toDate = today;

    this.loadLocation();
    this.loadExistingMealRequests();
  }

  loadCurrentUser(): void {
    const storedUser =
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('currentUser');

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);

      this.companyId = Number(
        this.currentUser.companyId ||
        this.currentUser.CompanyId ||
        0
      );

      this.userId = Number(
        this.currentUser.id ||
        this.currentUser.Id ||
        this.currentUser.userId ||
        this.currentUser.UserId ||
        0
      );
    }
  }

  loadLocation(): void {
    this._locationService.getLocation().subscribe({
      next: (res: any) => {
        this.locations = res?.data || [];
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

    this._mealRequestService.getAllMealRequests(this.companyId, this.userId).subscribe({
      next: (res: any) => {
        this.existingMealRequests = res?.data || res || [];

        // page load aagumbodhu current date ku location auto bind
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

    if (!this.toDate) {
      this.toDate = this.fromDate;
    }

    this.bindLocationByDate(this.fromDate);
  }

  bindLocationByDate(dateValue: string): void {
    if (!dateValue || !this.existingMealRequests.length) {
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
        matchedRequest.locationId ||
        matchedRequest.LocationId
      );
    } else {
      this.locationId = null;
    }
  }

  onSubmit(): void {
    if (!this.fromDate || !this.toDate || !this.locationId) {
      Swal.fire('Warning', 'Please select From Date, To Date and Location.', 'warning');
      return;
    }

    if (new Date(this.fromDate) > new Date(this.toDate)) {
      Swal.fire('Warning', 'From Date should not be greater than To Date.', 'warning');
      return;
    }

    if (!this.companyId || !this.userId) {
      Swal.fire('Error', 'Login user details not found. Please login again.', 'error');
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
          Swal.fire('Success', res.message || 'Meal request saved successfully.', 'success');

          this.loadExistingMealRequests();
          this.resetToToday();
          this.gotoshowqr();
        } else {
          Swal.fire('Warning', res?.message || 'Unable to save meal request.', 'warning');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;

        Swal.fire(
          'Error',
          err?.error?.message || 'Something went wrong while saving meal request.',
          'error'
        );
      }
    });
  }

  onCancel(): void {
    this.resetToToday();
  }


  gotoshowqr(){
    this.router.navigate(['/meal/show-qr']);
  }
  resetToToday(): void {
    const today = this.getTodayDateString();
    this.fromDate = today;
    this.toDate = today;
    this.bindLocationByDate(today);
  }

  getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  toDateOnly(value: string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}