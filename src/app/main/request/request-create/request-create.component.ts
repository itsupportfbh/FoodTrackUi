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

  companies: any[] = [];
  sessions: any[] = [];
  cuisines: any[] = [];
  locations: any[] = [];

  model: any = {
    id: 0,
    requestNo: '',
    companyId: null,
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

        this.companies = data.companies || data.Companies || [];
        this.sessions = data.sessions || data.Sessions || [];
        this.cuisines = data.cuisines || data.Cuisines || [];
        this.locations = data.locations || data.Locations || [];

        if (this.companies.length > 0 && !this.model.companyId) {
          this.model.companyId = Number(this.companies[0].id || this.companies[0].Id || 0);
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

        const apiLines = row.lines || row.Lines || [];

        this.model = {
          id: Number(row.id || row.Id || 0),
          requestNo: row.requestNo || row.RequestNo || '',
          companyId: Number(row.companyId || row.CompanyId || 0),
          fromDate: this.toDateInput(row.fromDate || row.FromDate),
          toDate: this.toDateInput(row.toDate || row.ToDate),
          totalQty: Number(row.totalQty || row.TotalQty || 0),
          isActive: row.isActive ?? row.IsActive ?? true,
          lines: apiLines
        };

        this.buildSessionGroups();
        this.patchExistingLinesToGroups();
        this.calculateTotalQty();
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
        id: 0,
        sessionId: Number(session.id || session.Id || 0),
        sessionName: session.name || session.Name || '',
        cuisineId: Number(cuisine.id || cuisine.Id || 0),
        cuisineName: cuisine.name || cuisine.Name || '',
        locationId: null,
        qty: 0
      }));

      return {
        sessionId: Number(session.id || session.Id || 0),
        sessionName: session.name || session.Name || '',
        isOpen: index === 0,
        lines
      };
    });

    this.syncLinesFromGroups();
  }

  patchExistingLinesToGroups(): void {
    const existingLines = this.model.lines || [];

    if (!existingLines.length) {
      return;
    }

    this.sessionGroups.forEach((group: any) => {
      group.lines.forEach((line: any) => {
        const existing = existingLines.find((x: any) =>
          Number(x.sessionId || x.SessionId || 0) === Number(line.sessionId || 0) &&
          Number(x.cuisineId || x.CuisineId || 0) === Number(line.cuisineId || 0)
        );

        if (existing) {
          line.id = Number(existing.id || existing.Id || 0);
          line.locationId = Number(existing.locationId || existing.LocationId || 0) || null;
          line.qty = Number(existing.qty || existing.Qty || 0);
        }
      });
    });

    this.syncLinesFromGroups();
  }

  toggleAccordion(group: any): void {
    group.isOpen = !group.isOpen;
    setTimeout(() => feather.replace());
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
      requestNo: '',
      companyId: this.companyId,
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