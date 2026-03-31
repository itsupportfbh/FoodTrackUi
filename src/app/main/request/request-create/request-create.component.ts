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
  requestId = 0;
  isEditMode = false;

  userId = 0;
  companyId = 0;

  companies: any[] = [];
  sessions: any[] = [];
  menus: any[] = [];
  locations: any[] = [];

  filteredSessions: any[] = [];
  filteredMenus: any[] = [];
  filteredLocations: any[] = [];

  model: any = {
    RequestId: 0,
    companyId: null,
    fromDate: '',
    toDate: '',
    sessionId: null,
    CuisineId: null,
    locationId: null,
    qty: null,
    isActive: true,
    userId: 0
  };

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

    this.model.userId = this.userId;

    this.route.paramMap.subscribe(params => {
      this.requestId = Number(params.get('id') || 0);
      this.isEditMode = this.requestId > 0;
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
        this.menus = data.cuisines || [];
        this.locations = data.locations || [];

        if (this.companies.length > 0) {
          this.model.companyId = this.companies[0].id;
        }

        this.applyCompanyFilters();

        if (this.isEditMode) {
          this.loadById();
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load masters', 'error');
      }
    });
  }

  loadById(): void {
    this.requestService.getRequestById(this.requestId).subscribe({
      next: (res: any) => {
        const row = res?.data;
        if (!row) return;

        this.model = {
          RequestId: row.requestId,
          companyId: row.companyId,
          fromDate: this.toDateInput(row.fromDate),
          toDate: this.toDateInput(row.toDate),
          sessionId: row.sessionId,
          CuisineId: row.cuisineId,
          locationId: row.locationId,
          qty: row.qty,
          isActive: row.isActive ?? true,
          userId: this.userId
        };

        this.applyCompanyFilters(false);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load request details', 'error');
      }
    });
  }

  onCompanyChange(): void {
    this.applyCompanyFilters();
  }

  applyCompanyFilters(resetValues: boolean = true): void {
    const companyId = Number(this.model.companyId || 0);

    this.filteredSessions = this.sessions.filter((x: any) => !companyId || Number(x.companyId) === companyId);
    this.filteredMenus = this.menus.filter((x: any) => !companyId || Number(x.companyId) === companyId);
    this.filteredLocations = this.locations.filter((x: any) => !companyId || Number(x.companyId) === companyId);

    if (resetValues) {
      this.model.sessionId = null;
      this.model.CuisineId = null;
      this.model.locationId = null;
    }
  }

  saveRequest(): void {
    if (!this.model.companyId || !this.model.fromDate || !this.model.toDate ||
        !this.model.sessionId || !this.model.CuisineId || !this.model.locationId || !this.model.qty) {
      Swal.fire('Validation', 'Please fill all required fields', 'warning');
      return;
    }

    if (this.model.fromDate > this.model.toDate) {
      Swal.fire('Validation', 'From Date should not be greater than To Date', 'warning');
      return;
    }

    const payload = {
      RequestId: this.model.RequestId || 0,
      CompanyId: this.model.companyId,
      SessionId: this.model.sessionId,
      CuisineId: this.model.CuisineId,
      LocationId: this.model.locationId,
      FromDate: this.model.fromDate,
      ToDate: this.model.toDate,
      Qty: this.model.qty,
      IsActive: this.model.isActive,
      UserId: this.userId
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
      RequestId: this.isEditMode ? this.requestId : 0,
      companyId: this.companyId,
      fromDate: '',
      toDate: '',
      sessionId: null,
      CuisineId: null,
      locationId: null,
      qty: null,
      isActive: true,
      userId: this.userId
    };

    this.applyCompanyFilters();
  }

  goBack(): void {
    this.router.navigate(['/catering/request']);
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}