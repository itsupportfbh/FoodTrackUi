import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { SitesettingsService } from './sitesettings.service';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-sitesettings',
  templateUrl: './sitesettings.component.html',
  styleUrls: ['./sitesettings.component.scss']
})
export class SitesettingsComponent implements OnInit, AfterViewInit {
  @ViewChild('siteForm') siteForm!: NgForm;

  isEditMode = false;

  breakfastCutOffTime = '';
  lunchCutOffTime = '';
  lateLunchCutOffTime = '';
  dinnerCutOffTime = '';
  lateDinnerCutOffTime = '';

  selectedSiteSetting: any = null;
  userId: string | null = null;

  constructor(private sitesettingsService: SitesettingsService) {
    this.userId = localStorage.getItem('id');
  }

  ngOnInit(): void {
    this.getLatestSiteSetting();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  getLatestSiteSetting(): void {
    this.sitesettingsService.getLatestSiteSetting().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res?.Data ?? res;

        if (data) {
          this.selectedSiteSetting = data;
          this.isEditMode = true;
          this.patchForm(data);
        } else {
          this.isEditMode = false;
          this.selectedSiteSetting = null;
          this.resetFormValues();
        }

        setTimeout(() => feather.replace(), 0);
      },
      error: (err) => {
        console.error('Failed to load latest site setting', err);
        this.isEditMode = false;
        this.selectedSiteSetting = null;
        this.resetFormValues();
      }
    });
  }

  patchForm(data: any): void {
    this.breakfastCutOffTime =
      data?.breakfastCutOffTime ?? data?.BreakfastCutOffTime ?? '';

    this.lunchCutOffTime =
      data?.lunchCutOffTime ?? data?.LunchCutOffTime ?? '';

    this.lateLunchCutOffTime =
      data?.lateLunchCutOffTime ?? data?.LateLunchCutOffTime ?? '';

    this.dinnerCutOffTime =
      data?.dinnerCutOffTime ?? data?.DinnerCutOffTime ?? '';

    this.lateDinnerCutOffTime =
      data?.lateDinnerCutOffTime ?? data?.LateDinnerCutOffTime ?? '';
  }

  private resetFormValues(): void {
    this.breakfastCutOffTime = '';
    this.lunchCutOffTime = '';
    this.lateLunchCutOffTime = '';
    this.dinnerCutOffTime = '';
    this.lateDinnerCutOffTime = '';
  }

  private resetFormState(): void {
    if (this.siteForm) {
      this.siteForm.form.markAsPristine();
      this.siteForm.form.markAsUntouched();
    }
  }

  clearFields(): void {
    this.resetFormValues();
    this.resetFormState();
  }

  cancel(): void {
    this.getLatestSiteSetting();
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill all required fields',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0e3a4c'
      });
      return;
    }

    const payload = {
      id: this.selectedSiteSetting?.id ?? this.selectedSiteSetting?.Id ?? 0,
      breakfastCutOffTime: this.breakfastCutOffTime || '',
      lunchCutOffTime: this.lunchCutOffTime || '',
      lateLunchCutOffTime: this.lateLunchCutOffTime || '',
      dinnerCutOffTime: this.dinnerCutOffTime || '',
      lateDinnerCutOffTime: this.lateDinnerCutOffTime || '',
      isActive: true,
      createdDate:
        this.selectedSiteSetting?.createdDate ??
        this.selectedSiteSetting?.CreatedDate ??
        new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      createdBy:
        this.selectedSiteSetting?.createdBy ??
        this.selectedSiteSetting?.CreatedBy ??
        Number(this.userId),
      updatedBy: Number(this.userId)
    };

    this.sitesettingsService.saveSiteSettings(payload).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res?.Data ?? payload;

        this.selectedSiteSetting = {
          ...this.selectedSiteSetting,
          ...data
        };
        this.isEditMode = true;
        this.patchForm(data);

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res?.message || res?.Message || 'Saved successfully',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0e3a4c'
        });

        this.getLatestSiteSetting();
        this.resetFormState();
      },
      error: (err) => {
        console.error('Save error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || err?.error || 'Failed to save site settings',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}