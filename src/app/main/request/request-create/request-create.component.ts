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
  orderDays = 3;
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
  isDateOverlap = false;
  dateOverlapMessage = '';

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

        this.orderDays = data.orderDays || 3;
        this.minDate = this.getDateAfterDays(this.orderDays);

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

  buildSessionGroups(): void {
    this.sessionGroups = this.sessions.map((session: any, index: number) => {
      const lines = this.cuisines.map((cuisine: any) => ({
        sessionId: Number(session.id || 0),
        sessionName: session.name || '',
        cuisineId: Number(cuisine.id || 0),
        cuisineName: cuisine.name || '',
        details: [
          {
            id: 0,
            locationId: null,
            locationObj: null,
            qty: 0
          }
        ]
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
        const matches = existingLines.filter((x: any) =>
          Number(x.sessionId) === Number(line.sessionId) &&
          Number(x.cuisineId) === Number(line.cuisineId)
        );

        if (matches.length > 0) {
          line.details = matches.map((existing: any) => {
            const locationId = Number(existing.locationId || 0) || null;
            const selectedLocation = this.locations.find(
              (loc: any) => Number(loc.id) === Number(locationId)
            );

            return {
              id: Number(existing.id || 0),
              locationId,
              locationObj: selectedLocation || null,
              qty: Number(existing.qty || 0)
            };
          });
        }
      });
    });

    this.syncLinesFromGroups();
  }

  toggleAccordion(group: any): void {
    group.isOpen = !group.isOpen;
    setTimeout(() => feather.replace());
  }

  addLocationRow(line: any): void {
    line.details.push({
      id: 0,
      locationId: null,
      locationObj: null,
      qty: 0
    });

    setTimeout(() => feather.replace());
  }

  removeLocationRow(line: any, detailIndex: number): void {
    line.details.splice(detailIndex, 1);
    this.onLineChange();
    setTimeout(() => feather.replace());
  }

  onDetailLocationChange(detail: any): void {
    detail.locationId = detail.locationObj ? Number(detail.locationObj.id) : null;
    this.onLineChange();
  }

  onLineChange(): void {
    this.syncLinesFromGroups();
    this.calculateTotalQty();
  }

  syncLinesFromGroups(): void {
    this.model.lines = this.sessionGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .reduce((acc: any[], line: any) => {
        const detailRows = (line.details || []).map((detail: any) => ({
          id: detail.id || 0,
          sessionId: line.sessionId,
          sessionName: line.sessionName,
          cuisineId: line.cuisineId,
          cuisineName: line.cuisineName,
          locationId: detail.locationId,
          locationObj: detail.locationObj,
          qty: Number(detail.qty) || 0
        }));

        return acc.concat(detailRows);
      }, [])
      .filter((row: any) => Number(row.locationId) > 0 || Number(row.qty) > 0);
  }

  calculateTotalQty(): void {
    const allDetails = this.sessionGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .reduce((acc: any[], line: any) => acc.concat(line.details || []), []);

    this.model.totalQty = allDetails.reduce(
      (sum: number, detail: any) => sum + (Number(detail.qty) || 0),
      0
    );
  }

  saveRequest(): void {
    if (!this.model.companyId || !this.model.fromDate || !this.model.toDate) {
      Swal.fire('Missing Information', 'Please fill header details', 'warning');
      return;
    }

    if (this.model.fromDate > this.model.toDate) {
      Swal.fire('Missing Information', 'From Date should not be greater than To Date', 'warning');
      return;
    }

    this.syncLinesFromGroups();
    this.calculateTotalQty();

    if (this.hasDuplicateLocations()) {
      Swal.fire(
        'Missing Information',
        'Same cuisine cannot have duplicate locations in the same session',
        'warning'
      );
      return;
    }

    const validLines = this.sessionGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .reduce((acc: any[], line: any) => {
        const validDetails = (line.details || [])
          .filter((d: any) => d.locationId && Number(d.qty) > 0)
          .map((d: any) => ({
            Id: d.id || 0,
            SessionId: line.sessionId,
            CuisineId: line.cuisineId,
            LocationId: d.locationId,
            Qty: Number(d.qty) || 0
          }));

        return acc.concat(validDetails);
      }, []);

    if (!validLines.length) {
      Swal.fire('Missing Information', 'Please select location and qty for at least one row', 'warning');
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
    if (this.isDateOverlap) {
      Swal.fire(
        'Warning',
        'Order already exists for the selected date range.',
        'warning'
      );
      return;
    }

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

  private hasDuplicateLocations(): boolean {
    for (const group of this.sessionGroups) {
      for (const line of group.lines || []) {
        const selectedIds = (line.details || [])
          .map((d: any) => Number(d.locationId || 0))
          .filter((id: number) => id > 0);

        const uniqueIds = new Set(selectedIds);

        if (selectedIds.length !== uniqueIds.size) {
          return true;
        }
      }
    }

    return false;
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

  private updateToDateMax(): void {
    if (!this.model.fromDate) {
      this.toDateMax = '';
      return;
    }

    const fromDate = new Date(this.model.fromDate);
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();

    const lastDate = new Date(year, month + 1, 0);

    const maxYear = lastDate.getFullYear();
    const maxMonth = ('0' + (lastDate.getMonth() + 1)).slice(-2);
    const maxDay = ('0' + lastDate.getDate()).slice(-2);

    this.toDateMax = `${maxYear}-${maxMonth}-${maxDay}`;

    if (this.model.toDate && this.model.toDate > this.toDateMax) {
      this.model.toDate = this.toDateMax;
    }
  }

  private getDateAfterDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

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
  checkDateOverlap(): void {
  this.isDateOverlap = false;
  this.dateOverlapMessage = '';

  if (!this.model.companyId || !this.model.fromDate || !this.model.toDate) {
    return;
  }

  this.requestService.checkOverlap(
    this.model.companyId,
    this.model.fromDate,
    this.model.toDate,
    this.model.id || 0
  ).subscribe({
    next: (res: any) => {
      this.isDateOverlap = res?.isOverlap || false;

      if (this.isDateOverlap) {
        this.dateOverlapMessage =
          'Order already exists for the selected date range.';
        Swal.fire(
          'Warning',
          this.dateOverlapMessage,
          'warning'
        );
      }
    },
    error: (err:any) => {
      console.error(err);
    }
  });
}
}