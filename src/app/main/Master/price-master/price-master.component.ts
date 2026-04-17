import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';
import { CuisinePriceService } from './cuisine-price.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrls: ['./price-master.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceMasterComponent implements OnInit {
  companyList: any[] = [];
  sessionList: any[] = [];

  selectedCompanyId: number =0 ;
  selectedSessionId: number =0 ;

  loading = false;
  saving = false;

  rateModel = {
    rate: 0,
    effectiveFrom: ''
  };

  constructor(
    private http: HttpClient,
    private cuisinePriceService: CuisinePriceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMasters();
    this.rateModel.effectiveFrom = this.todayDate();
    this.loadFromQueryParams();
  }

  loadFromQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const companyId = Number(params['companyId'] || 0);
      const sessionId = Number(params['sessionId'] || 0);

      if (companyId > 0) {
        this.selectedCompanyId = companyId;
      }

      if (sessionId > 0) {
        this.selectedSessionId = sessionId;
      }

      if (this.selectedCompanyId && this.selectedSessionId) {
        this.getSessionRate();
      }
    });
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
      this.clearRate();
      return;
    }

    this.getSessionRate();
  }

 getSessionRate(): void {
  this.loading = true;

  this.cuisinePriceService
    .getAllCuisinesWithRates(this.selectedCompanyId, this.selectedSessionId)
    .subscribe({
      next: (res: any) => {
        this.loading = false;

        const data = res?.data || [];
        const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (firstRow) {
          this.rateModel = {
            rate: Number(firstRow.rate) || 0,
            effectiveFrom: firstRow.effectiveFrom
              ? this.toInputDate(firstRow.effectiveFrom)
              : this.todayDate()
          };
        } else {
          this.clearRate();
        }
      },
      error: (err) => {
        this.loading = false;
        this.clearRate();

        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to load session rate',
          'error'
        );
      }
    });
}

  saveRate(): void {
    if (!this.selectedCompanyId || !this.selectedSessionId) {
      Swal.fire('Validation', 'Please select company and session', 'warning');
      return;
    }

    if (!this.rateModel.rate || Number(this.rateModel.rate) <= 0) {
      Swal.fire('Validation', 'Please enter valid rate', 'warning');
      return;
    }

    if (!this.rateModel.effectiveFrom) {
      Swal.fire('Validation', 'Please select effective from date', 'warning');
      return;
    }

    const payload = {
      companyId: this.selectedCompanyId,
      sessionId: this.selectedSessionId,
      rate: Number(this.rateModel.rate),
      effectiveFrom: this.rateModel.effectiveFrom,
      updatedBy: Number(localStorage.getItem('userId') || 1)
    };

    this.saving = true;

    this.cuisinePriceService.saveBulkCuisineRates(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        Swal.fire('Success', res?.message || 'Saved successfully', 'success').then(() => {
          this.router.navigate(['/master/priceLists']);
        });
      },
      error: (err) => {
        this.saving = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to save rate',
          'error'
        );
      }
    });
  }

  goBackToList(): void {
    this.router.navigate(['/master/priceLists']);
  }

  clearRate(): void {
    this.rateModel = {
      rate: 0,
      effectiveFrom: this.todayDate()
    };
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
}
