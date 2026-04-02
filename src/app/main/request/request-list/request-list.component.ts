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

viewRequestDetails(row: any): void {
  this.requestService.getRequestById(row.id).subscribe({
    next: (res: any) => {
      console.log('request details response:', res);

      let details: any[] = [];

      if (Array.isArray(res)) {
        details = res;
      } else if (Array.isArray(res?.data)) {
        details = res.data;
      } else if (Array.isArray(res?.data?.lines)) {
        details = res.data.lines;
      } else if (Array.isArray(res?.lines)) {
        details = res.lines;
      } else {
        details = [];
      }

      const groupedDetails = this.groupBySession(details);

      let html = `
  <div style="text-align:left; max-height:60vh; overflow-y:auto; padding-right:4px;">

    <div style="
      display:grid;
      grid-template-columns: repeat(2, 1fr);
      gap:12px 24px;
      margin-bottom:18px;
      padding:16px 18px;
      background:#f8f8fb;
      border:1px solid #ebe9f1;
      border-radius:12px;
    ">
      <div style="display:flex; align-items:center; gap:8px; font-size:15px; color:#5e5873;">
        <span style="font-size:13px; font-weight:700; color:#6e6b7b; min-width:90px;">COMPANY</span>
        <span style="color:#6e6b7b;">:</span>
        <span style="font-weight:500;">${row.companyName || '-'}</span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; font-size:15px; color:#5e5873;">
        <span style="font-size:13px; font-weight:700; color:#6e6b7b; min-width:90px;">TOTAL QTY</span>
        <span style="color:#6e6b7b;">:</span>
        <span style="font-weight:500;">${row.totalQty ?? 0}</span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; font-size:15px; color:#5e5873;">
        <span style="font-size:13px; font-weight:700; color:#6e6b7b; min-width:90px;">FROM DATE</span>
        <span style="color:#6e6b7b;">:</span>
        <span style="font-weight:500;">${this.displayDate(row.fromDate)}</span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; font-size:15px; color:#5e5873;">
        <span style="font-size:13px; font-weight:700; color:#6e6b7b; min-width:90px;">TO DATE</span>
        <span style="color:#6e6b7b;">:</span>
        <span style="font-weight:500;">${this.displayDate(row.toDate)}</span>
      </div>
    </div>
`;

      if (!details.length) {
        html += `
          <div style="
            text-align:center;
            color:#6e6b7b;
            padding:24px 0;
            border:1px solid #ebe9f1;
            border-radius:12px;
            background:#fff;
          ">
            No line details found
          </div>
        `;
      } else {
        Object.keys(groupedDetails).forEach((sessionName: string) => {
          const sessionRows = groupedDetails[sessionName];

          html += `
            <div style="margin-bottom:16px; border:1px solid #ebe9f1; border-radius:14px; overflow:hidden;">
              <div style="
                background: linear-gradient(90deg, #7367f0 0%, #9e95f5 100%);
                color: #fff;
                padding: 12px 14px;
                display:flex;
                justify-content:space-between;
                align-items:center;
                font-weight:600;
                font-size:15px;
              ">
                <span>${sessionName}</span>
                <span style="
                  background: rgba(255,255,255,0.18);
                  padding: 4px 10px;
                  border-radius: 999px;
                  font-size: 12px;
                ">
                  ${sessionRows.length} cuisines
                </span>
              </div>

              <table style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8f8fb;">
                    <th style="padding:10px 14px; text-align:left; font-size:12px; color:#6e6b7b; border-bottom:1px solid #ebe9f1;">CUISINE</th>
                    <th style="padding:10px 14px; text-align:left; font-size:12px; color:#6e6b7b; border-bottom:1px solid #ebe9f1;">LOCATION</th>
                    <th style="padding:10px 14px; text-align:left; font-size:12px; color:#6e6b7b; border-bottom:1px solid #ebe9f1;">QTY</th>
                  </tr>
                </thead>
                <tbody>
          `;

          sessionRows.forEach((item: any) => {
            html += `
              <tr>
                <td style="padding:10px 14px; border-bottom:1px solid #f3f2f7; color:#6e6b7b; font-size:14px;">
                  ${item.cuisineName || item.cuisine || '-'}
                </td>
                <td style="padding:10px 14px; border-bottom:1px solid #f3f2f7; color:#6e6b7b; font-size:14px;">
                  ${item.locationName || item.location || '-'}
                </td>
                <td style="padding:10px 14px; border-bottom:1px solid #f3f2f7; color:#6e6b7b; font-size:14px;">
                  ${item.qty ?? item.requestedQty ?? item.totalQty ?? 0}
                </td>
              </tr>
            `;
          });

          html += `
                </tbody>
              </table>
            </div>
          `;
        });
      }

      html += `</div>`;

      Swal.fire({
        title: `Order Details - ${row.requestNo}`,
        html,
        width: 950,
        confirmButtonText: 'Close',
        confirmButtonColor: '#7367f0'
      });
    },
    error: (err) => {
      console.error(err);
      Swal.fire('Error', 'Failed to load request details', 'error');
    }
  });
}
 private groupBySession(items: any[]): { [key: string]: any[] } {
  if (!Array.isArray(items)) {
    return {};
  }

  return items.reduce((acc: any, curr: any) => {
    const key = curr.sessionName || curr.session || 'Others';

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(curr);
    return acc;
  }, {});
}
private displayDate(value: any): string {
  const dt = this.parseDateOnly(value);
  if (!dt) return '-';

  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
}