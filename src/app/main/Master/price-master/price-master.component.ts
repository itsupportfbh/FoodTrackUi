import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';
import { CuisinePriceService } from './cuisine-price.service';

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrls: ['./price-master.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceMasterComponent implements OnInit {
  companyList: any[] = [];
  sessionList: any[] = [];
  cuisineRates: any[] = [];

  selectedCompanyId: number | null = null;
  selectedSessionId: number | null = null;

  loading = false;
  saving = false;

  constructor(
    private http: HttpClient,
    private cuisinePriceService: CuisinePriceService
  ) {}

  ngOnInit(): void {
    this.loadMasters();
  }

  loadMasters(): void {
    const apiUrl = environment.apiUrl;

    this.http.get(`${apiUrl}/Company/list`).subscribe({
      next: (res: any) => {
        this.companyList = res?.data || res || [];
      },
      error: () => {
        this.companyList = [];
      }
    });

    this.http.get(`${apiUrl}/Session/GetAllSession`).subscribe({
      next: (res: any) => {
        this.sessionList = res?.data || res || [];
      },
      error: () => {
        this.sessionList = [];
      }
    });
  }

  onSelectionChange(): void {
    if (!this.selectedCompanyId || !this.selectedSessionId) {
      this.cuisineRates = [];
      return;
    }

    this.getCuisineRates();
  }

  getCuisineRates(): void {
    this.loading = true;

    this.cuisinePriceService
      .getAllCuisinesWithRates(this.selectedCompanyId!, this.selectedSessionId!)
      .subscribe({
        next: (res: any) => {
          this.loading = false;

          const data = res?.data || [];
          this.cuisineRates = data.map((x: any) => ({
            cuisineId: x.cuisineId,
            cuisineName: x.cuisineName,
            rate: x.rate || 0,
            effectiveFrom: x.effectiveFrom
              ? this.toInputDate(x.effectiveFrom)
              : this.todayDate()
          }));
        },
        error: (err) => {
          this.loading = false;
          this.cuisineRates = [];
          Swal.fire(
            'Error',
            err?.error?.message || 'Failed to load cuisine rates',
            'error'
          );
        }
      });
  }

  todayDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toInputDate(value: string): string {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  clearRates(): void {
    this.cuisineRates = this.cuisineRates.map((x: any) => ({
      ...x,
      rate: 0,
      effectiveFrom: this.todayDate()
    }));
  }

  saveAllRates(): void {
    if (!this.selectedCompanyId || !this.selectedSessionId) {
      Swal.fire('Validation', 'Please select company and session', 'warning');
      return;
    }

    const validRates = this.cuisineRates.filter(
      (x: any) => Number(x.rate) > 0 && x.effectiveFrom
    );

    if (!validRates.length) {
      Swal.fire('Validation', 'Please enter at least one cuisine rate with effective date', 'warning');
      return;
    }

    const payload = {
      companyId: this.selectedCompanyId,
      sessionId: this.selectedSessionId,
      updatedBy: Number(localStorage.getItem('userId') || 1),
      rates: validRates.map((x: any) => ({
        cuisineId: x.cuisineId,
        rate: Number(x.rate),
        effectiveFrom: x.effectiveFrom
      }))
    };

    this.saving = true;

    this.cuisinePriceService.saveBulkCuisineRates(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        Swal.fire('Success', res?.message || 'Saved successfully', 'success');
        this.getCuisineRates();
      },
      error: (err) => {
        this.saving = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to save rates',
          'error'
        );
      }
    });
  }
}