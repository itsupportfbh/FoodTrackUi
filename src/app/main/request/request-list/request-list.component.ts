import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { RequestService } from '../request-service';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss']
})
export class RequestListComponent implements OnInit, AfterViewInit, AfterViewChecked {
  rows: any[] = [];
  filteredRows: any[] = [];

  searchText = '';
  selectedOption = 10;

  userId = 0;
  companyId = 0;
  isAdmin = false;
   roleId = 0;

  constructor(
    private requestService: RequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.userId = Number(currentUser.id || 0);
      this.companyId = Number(currentUser.companyId || 0);
      this.roleId = Number(currentUser.roleId || currentUser.RoleId || 0);
    }

    const role = (localStorage.getItem('role') || '').toLowerCase();
    this.isAdmin = role.includes('admin');

    this.loadRequests();
  }
   get isOwnerView(): boolean {
    return this.companyId === 0;
  }
   get canManageOrders(): boolean {
  return this.roleId !== 1;
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  loadRequests(): void {
    // const payload = {
    //   userId: this.userId,
    //   companyId: this.companyId,
    //   isAdmin: this.isAdmin
    // };

    this.requestService.getAllRequests(this.userId).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.filteredRows = [...this.rows];
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load requests', 'error');
      }
    });
  }

  filterRequests(): void {
    const text = (this.searchText || '').trim().toLowerCase();

    if (!text) {
      this.filteredRows = [...this.rows];
      return;
    }

    this.filteredRows = this.rows.filter((x: any) =>
      (x.requestNo || '').toLowerCase().includes(text) ||
      (x.companyName || '').toLowerCase().includes(text) ||
      (x.totalQty || '').toString().toLowerCase().includes(text) ||
      (x.fromDate || '').toString().toLowerCase().includes(text) ||
      (x.toDate || '').toString().toLowerCase().includes(text)
    );
  }

  onPageSizeChange(): void {
    this.filteredRows = [...this.filteredRows];
  }

  openCreate(): void {
    if (!this.canManageOrders) {
      return;
    }
    this.router.navigate(['/catering/request-create']);
  }

  editRequest(row: any): void {
    if (!this.canManageOrders) {
      return;
    }
    this.router.navigate(['/catering/request-edit', row.id]);
  }

  deleteRequest(row: any): void {
    if (!this.canManageOrders) {
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: 'This request will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ea5455'
    }).then((result) => {
      if (result.isConfirmed) {
        this.requestService.deleteRequest(row.id, this.userId).subscribe({
          next: (res: any) => {
            Swal.fire('Deleted', res?.message || 'Request deleted successfully', 'success');
            this.loadRequests();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', err?.error?.message || 'Delete failed', 'error');
          }
        });
      }
    });
  }

  get pagedRows(): any[] {
    return this.filteredRows.slice(0, this.selectedOption);
  }
  openOverride(row: any): void {
  const today = new Date().toISOString().split('T')[0];
  const requestFrom = this.toInputDate(row.fromDate);
  const requestTo = this.toInputDate(row.toDate);

  Swal.fire({
    title: 'Select Override Date Range',
    html: `
      <div style="text-align:left;">
        <label style="display:block; margin-bottom:8px; font-weight:600;">
          Request No: ${row.requestNo}
        </label>

        <label style="display:block; margin:10px 0 6px;">From Date</label>
        <input 
          id="overrideFromDate" 
          type="date" 
          class="swal2-input" 
          value="${requestFrom || today}"
          style="width:100%; margin:0 0 10px 0;"
        />

        <label style="display:block; margin:10px 0 6px;">To Date</label>
        <input 
          id="overrideToDate" 
          type="date" 
          class="swal2-input" 
          value="${requestTo || today}"
          style="width:100%; margin:0;"
        />
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Open Override',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#7367f0',
    preConfirm: () => {
      const fromDate = (document.getElementById('overrideFromDate') as HTMLInputElement)?.value;
      const toDate = (document.getElementById('overrideToDate') as HTMLInputElement)?.value;

      if (!fromDate || !toDate) {
        Swal.showValidationMessage('Please select from date and to date');
        return false;
      }

      const reqFrom = this.parseDateOnly(row.fromDate);
      const reqTo = this.parseDateOnly(row.toDate);
      const selFrom = this.parseDateOnly(fromDate);
      const selTo = this.parseDateOnly(toDate);

      if (!reqFrom || !reqTo || !selFrom || !selTo) {
        Swal.showValidationMessage('Invalid date value found');
        return false;
      }

      if (selFrom.getTime() > selTo.getTime()) {
        Swal.showValidationMessage('From date cannot be greater than to date');
        return false;
      }

      if (selFrom.getTime() < reqFrom.getTime() || selTo.getTime() > reqTo.getTime()) {
        Swal.showValidationMessage('Override range must be within request date range');
        return false;
      }

      return { fromDate, toDate };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.router.navigate(['/requestoverride/Request-override'], {
        queryParams: {
          requestHeaderId: row.id,
          fromDate: result.value.fromDate,
          toDate: result.value.toDate
        }
      });
    }
  });
}
private parseDateOnly(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // dd-MM-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [d, m, y] = text.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  // ISO datetime / other parseable formats
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}

private toInputDate(value: any): string {
  const dt = this.parseDateOnly(value);
  if (!dt) return '';

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

private formatDate(value: any): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

  openOverrideList(row: any): void {
    this.router.navigate(['/catering/request-override-list'], {
      queryParams: {
        requestHeaderId: row.id,
        requestNo: row.requestNo
      }
    });
  }
}