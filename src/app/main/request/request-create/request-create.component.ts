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
  menus: any[] = [];
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

        this.companies = data.companies || [];
        this.sessions = data.sessions || [];
        this.menus = data.cuisines || [];
        this.locations = data.locations || [];

        if (this.companies.length > 0) {
          this.model.companyId = this.companies[0].id;
        }

        if (this.isEditMode) {
          this.loadById();
        } else {
          this.addLine();
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
        if (!row) return;

        this.model = {
          id: row.id,
          requestNo: row.requestNo,
          companyId: row.companyId,
          fromDate: this.toDateInput(row.fromDate),
          toDate: this.toDateInput(row.toDate),
          totalQty: row.totalQty || 0,
          isActive: row.isActive ?? true,
          lines: (row.lines || []).map((x: any) => ({
            id: x.id,
            sessionId: x.sessionId,
            cuisineId: x.cuisineId,
            locationId: x.locationId,
            qty: x.qty
          }))
        };

        if (!this.model.lines.length) {
          this.addLine();
        }

        this.calculateTotalQty();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load request details', 'error');
      }
    });
  }

  addLine(): void {
    this.model.lines.push({
      id: 0,
      sessionId: null,
      cuisineId: null,
      locationId: null,
      qty: null
    });
  }

  removeLine(index: number): void {
    this.model.lines.splice(index, 1);

    if (this.model.lines.length === 0) {
      this.addLine();
    }

    this.calculateTotalQty();
  }

  calculateTotalQty(): void {
    this.model.totalQty = (this.model.lines || []).reduce(
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

    const validLines = (this.model.lines || []).filter((x: any) =>
      x.sessionId && x.cuisineId && x.locationId && Number(x.qty) > 0
    );

    if (!validLines.length) {
      Swal.fire('Validation', 'Please add at least one valid line', 'warning');
      return;
    }

    this.calculateTotalQty();

    const payload = {
      Id: this.model.id || 0,
      CompanyId: this.model.companyId,
      FromDate: this.model.fromDate,
      ToDate: this.model.toDate,
      TotalQty: this.model.totalQty,
      IsActive: this.model.isActive,
      UserId: this.userId,
      Lines: validLines.map((x: any) => ({
        Id: x.id || 0,
        SessionId: x.sessionId,
        CuisineId: x.cuisineId,
        LocationId: x.locationId,
        Qty: x.qty
      }))
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

    this.addLine();
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