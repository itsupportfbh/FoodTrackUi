import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { RequestService } from '../request-service';

@Component({
  selector: 'app-request-create',
  templateUrl: './request-create.component.html',
  styleUrls: ['./request-create.component.scss']
})
export class RequestCreateComponent implements OnInit, AfterViewInit, AfterViewChecked {
  id = 0;
  isEditMode = false;

  userId = 0;
  companyId = 0;
  minDate = '';
  toDateMax = '';

  companies: any[] = [];
  sessions: any[] = [];
  cuisines: any[] = [];
  locations: any[] = [];

  model: any = {
    id: 0,
    companyId: null,
    companyName: '',
    fromDate: '',
    toDate: '',
    totalQty: 0,
    isActive: true,
    lines: []
  };

  sessionGroups: any[] = [];

  constructor(
    private requestService: RequestService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.minDate = this.getDateAfterDays(3);
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.userId = Number(currentUser.id || 0);
      this.companyId = Number(currentUser.companyId || 0);
    }

    this.route.paramMap.subscribe(params => {
      this.id = Number(params.get('id') || 0);
      this.isEditMode = this.id > 0;
      this.loadMasters();
    });
  }
  getDateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
  

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  loadMasters(): void {
    this.requestService.getPageMasters(this.userId, this.companyId).subscribe({
      next: (res: any) => {
        const data = res?.data || {};

        this.companies = data.companies || [];
        this.sessions = data.sessions || [];
        this.cuisines = data.cuisines || [];
        this.locations = data.locations || [];

        if (!this.isEditMode && this.companies.length > 0) {
          this.model.companyId = Number(this.companies[0].id || 0);
          this.model.companyName = this.companies[0].name || '';
        }

        if (this.isEditMode) {
          this.loadById();
        } else {
          this.buildSessionGroups();
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load masters', 'error');
      }
    });
  }

  loadById(): void {
    this.requestService.getRequestById(this.id).subscribe({
      next: (res: any) => {
        const row = res?.data;
        if (!row) {
          return;
        }

        this.model = {
          id: Number(row.id || 0),
          companyId: Number(row.companyId || 0),
          companyName: row.companyName || '',
          fromDate: this.toDateInput(row.fromDate),
          toDate: this.toDateInput(row.toDate),
          totalQty: Number(row.totalQty || 0),
          isActive: row.isActive ?? true,
          lines: row.lines || []
        };
        this.updateToDateMax();

        if (!this.model.companyName) {
          const company = this.companies.find((x: any) => Number(x.id) === Number(this.model.companyId));
          this.model.companyName = company ? company.name : '';
        }

        this.buildSessionGroups();
        this.patchExistingLinesToGroups();
        this.calculateTotalQty();

        setTimeout(() => feather.replace());
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load request details', 'error');
      }
    });
  }

  private updateToDateMax(): void {
  if (!this.model.fromDate) {
    this.toDateMax = '';
    return;
  }

  const fromDate = new Date(this.model.fromDate);
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();

  // அந்த month-ஓட last date
  const lastDate = new Date(year, month + 1, 0);

  const maxYear = lastDate.getFullYear();
  const maxMonth = ('0' + (lastDate.getMonth() + 1)).slice(-2);
  const maxDay = ('0' + lastDate.getDate()).slice(-2);

  this.toDateMax = `${maxYear}-${maxMonth}-${maxDay}`;

  if (this.model.toDate && this.model.toDate > this.toDateMax) {
    this.model.toDate = this.toDateMax;
  }
}
  buildSessionGroups(): void {
    this.sessionGroups = this.sessions.map((session: any, index: number) => {
      const lines = this.cuisines.map((cuisine: any) => ({
        id: 0,
        sessionId: Number(session.id || 0),
        sessionName: session.name || '',
        cuisineId: Number(cuisine.id || 0),
        cuisineName: cuisine.name || '',
        locationId: null,
        locationObj: null,
        qty: 0
      }));

      return {
        sessionId: Number(session.id || 0),
        sessionName: session.name || '',
        isOpen: this.isEditMode ? true : index === 0,
        lines
      };
    });
  }

  patchExistingLinesToGroups(): void {
    const existingLines = this.model.lines || [];

    if (!existingLines.length) {
      return;
    }

    this.sessionGroups.forEach((group: any) => {
      group.lines.forEach((line: any) => {
        const existing = existingLines.find((x: any) =>
          Number(x.sessionId) === Number(line.sessionId) &&
          Number(x.cuisineId) === Number(line.cuisineId)
        );

        if (existing) {
          line.id = Number(existing.id || 0);
          line.locationId = Number(existing.locationId || 0) || null;
          line.qty = Number(existing.qty || 0);

          const selectedLocation = this.locations.find(
            (loc: any) => Number(loc.id) === Number(line.locationId)
          );
          line.locationObj = selectedLocation || null;
        }
      });
    });

    this.syncLinesFromGroups();
  }

  toggleAccordion(group: any): void {
    group.isOpen = !group.isOpen;
    setTimeout(() => feather.replace());
  }

  onLocationChange(line: any): void {
    line.locationId = line.locationObj ? Number(line.locationObj.id) : null;
    this.onLineChange();
  }

  syncLinesFromGroups(): void {
    this.model.lines = this.sessionGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .filter((line: any) => Number(line.locationId) > 0 || Number(line.qty) > 0);
  }

  onLineChange(): void {
    this.syncLinesFromGroups();
    this.calculateTotalQty();
  }

  calculateTotalQty(): void {
    const allLines = this.sessionGroups.reduce(
      (acc: any[], group: any) => acc.concat(group.lines || []),
      []
    );

    this.model.totalQty = allLines.reduce(
      (sum: number, line: any) => sum + (Number(line.qty) || 0),
      0
    );
  }

  saveRequest(): void {
    if (!this.model.companyId || !this.model.fromDate || !this.model.toDate) {
      Swal.fire('Validation', 'Please fill header details', 'warning');
      return;
    }

    if (this.model.fromDate > this.model.toDate) {
      Swal.fire('Validation', 'From Date should not be greater than To Date', 'warning');
      return;
    }

    this.syncLinesFromGroups();
    this.calculateTotalQty();

    const validLines = this.sessionGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .filter((x: any) => x.locationId && Number(x.qty) > 0)
      .map((x: any) => ({
        Id: x.id || 0,
        SessionId: x.sessionId,
        CuisineId: x.cuisineId,
        LocationId: x.locationId,
        Qty: Number(x.qty) || 0
      }));

    if (!validLines.length) {
      Swal.fire('Validation', 'Please select location and qty for at least one row', 'warning');
      return;
    }

    const payload = {
      Id: this.model.id || 0,
      CompanyId: this.model.companyId,
      FromDate: this.model.fromDate,
      ToDate: this.model.toDate,
      TotalQty: this.model.totalQty,
      IsActive: this.model.isActive,
      UserId: this.userId,
      Lines: validLines
    };

    this.requestService.saveRequest(payload).subscribe({
      next: (res: any) => {
        Swal.fire('Success', res?.message || 'Request saved successfully', 'success').then(() => {
          this.router.navigate(['/catering/request']);
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err?.error?.message || 'Save failed', 'error');
      }
    });
  }

  resetForm(): void {
    this.model = {
      id: this.isEditMode ? this.id : 0,
      companyId: this.companyId,
      companyName: this.model.companyName || '',
      fromDate: '',
      toDate: '',
      totalQty: 0,
      isActive: true,
      lines: []
    };

    this.buildSessionGroups();
  }

  goBack(): void {
    this.router.navigate(['/catering/request']);
  }
onFromDateChange(): void {
  this.updateToDateMax();

  if (this.model.toDate) {
    if (this.model.fromDate && this.model.toDate < this.model.fromDate) {
      this.model.toDate = '';
      return;
    }

    if (this.toDateMax && this.model.toDate > this.toDateMax) {
      this.model.toDate = this.toDateMax;
    }
  }
}

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  private toDateInput(value: any): string {
    if (!value) {
      return '';
    }

    const d = new Date(value);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
 
}