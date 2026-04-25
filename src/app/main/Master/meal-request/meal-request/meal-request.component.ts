import { Component, OnInit } from '@angular/core';
import { LocationService } from '../../location/location.service';

import Swal from 'sweetalert2';
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
  locations: any[] = [];

  isSubmitting = false;

  currentUser: any;
  companyId = 0;
  userId = 0;

  constructor(
    private _locationService: LocationService,
    private _mealRequestService: MealRequestService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadLocation();
  }

  loadCurrentUser(): void {
    const storedUser =
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('currentUser');

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.companyId = Number(this.currentUser.companyId || this.currentUser.CompanyId || 0);
      this.userId = Number(this.currentUser.id || this.currentUser.Id || this.currentUser.userId || 0);
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
          this.onCancel();
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
    this.fromDate = '';
    this.toDate = '';
    this.locationId = null;
  }
}