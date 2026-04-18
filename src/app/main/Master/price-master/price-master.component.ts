import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import Swal from 'sweetalert2';
import { CuisinePriceService } from './cuisine-price.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface SessionRateRow {
  sessionId: number;
  sessionName: string;
  rate: number;
  effectiveFrom: string;
}

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrls: ['./price-master.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceMasterComponent implements OnInit {
  companyList: any[] = [];
  selectedCompanyId: number = 0;

  sessionLoading = false;
  saving = false;

  sessionRateRows: SessionRateRow[] = [];

  constructor(
    private cuisinePriceService: CuisinePriceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.cuisinePriceService.getCompanies().subscribe({
      next: (res: any) => {
        this.companyList = res?.data || res || [];
        this.loadFromQueryParams();
      },
      error: () => {
        this.companyList = [];
      }
    });
  }

  loadFromQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const companyId = Number(params['companyId'] || 0);

      if (companyId > 0) {
        this.selectedCompanyId = companyId;
        this.loadAssignedSessions(companyId);
      }
    });
  }

  onCompanyChange(companyId: number): void {
    this.selectedCompanyId = Number(companyId || 0);
    this.sessionRateRows = [];

    if (!this.selectedCompanyId) {
      return;
    }

    this.loadAssignedSessions(this.selectedCompanyId);
  }

  loadAssignedSessions(companyId: number): void {
    this.sessionLoading = true;
    this.sessionRateRows = [];

    this.cuisinePriceService.getAssignedSessionsByCompanyId(companyId).subscribe({
      next: (res: any) => {
        const sessions = (res?.data || res || []).map((x: any) => ({
          sessionId: Number(x.id ?? x.Id),
          sessionName: x.sessionName || x.SessionName,
          rate: 0,
          effectiveFrom: this.todayDate()
        }));

        this.sessionRateRows = sessions;
        this.sessionLoading = false;

        if (this.sessionRateRows.length > 0) {
          this.loadExistingRates();
        }
      },
      error: () => {
        this.sessionLoading = false;
        this.sessionRateRows = [];
      }
    });
  }

  loadExistingRates(): void {
    const requests = this.sessionRateRows.map(row =>
      this.cuisinePriceService.getAllCuisinesWithRates(this.selectedCompanyId, row.sessionId)
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        responses.forEach((res: any, index: number) => {
          const data = res?.data || [];
          const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

          if (firstRow) {
            this.sessionRateRows[index].rate = Number(firstRow.rate) || 0;
            this.sessionRateRows[index].effectiveFrom = firstRow.effectiveFrom
              ? this.toInputDate(firstRow.effectiveFrom)
              : this.todayDate();
          }
        });
      },
      error: () => {
        // fallback leave default values
      }
    });
  }

  saveRates(): void {
    if (!this.selectedCompanyId) {
      Swal.fire('Validation', 'Please select company', 'warning');
      return;
    }

    if (!this.sessionRateRows.length) {
      Swal.fire('Validation', 'No sessions available for this company', 'warning');
      return;
    }

    const invalidRow = this.sessionRateRows.find(
      x => !x.rate || Number(x.rate) <= 0 || !x.effectiveFrom
    );

    if (invalidRow) {
      Swal.fire(
        'Validation',
        `Please enter valid rate and effective from for ${invalidRow.sessionName}`,
        'warning'
      );
      return;
    }

    this.saving = true;

    const requests = this.sessionRateRows.map(row =>
      this.cuisinePriceService.saveBulkCuisineRates({
        companyId: this.selectedCompanyId,
        sessionId: row.sessionId,
        rate: Number(row.rate),
        effectiveFrom: row.effectiveFrom,
        updatedBy: Number(localStorage.getItem('userId') || 1)
      })
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Success', 'Rates saved successfully', 'success').then(() => {
          this.router.navigate(['/master/priceLists']);
        });
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

  goBackToList(): void {
    this.router.navigate(['/master/priceLists']);
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