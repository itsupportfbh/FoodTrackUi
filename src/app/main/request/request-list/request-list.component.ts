import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { RequestService } from '../request-service';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class RequestListComponent implements OnInit, AfterViewInit, AfterViewChecked {
  rows: any[] = [];
  filteredRows: any[] = [];

  searchText = '';
  selectedOption = 10;
  pageNumber = 0;
  orderDays = 3;
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
 this.loadSiteSettings();
    const role = (localStorage.getItem('role') || '').toLowerCase();
    this.isAdmin = role.includes('admin');

    this.loadRequests();
    this.loadorderDate();
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
        this.pageNumber = 0;
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load requests', 'error');
      }
    });
  }

  loadorderDate(): void {
    this.requestService.getOrderDate().subscribe({
      next: (res: any) => {
        this.orderDays = res || 3;
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load order days', 'error');
      }
    });
  }


  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((x: string) => x.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
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
      this.pageNumber = 0;
  }

  onPageSizeChange(): void {
     this.pageNumber = 0;
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
            this.loadorderDate();
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

isAtLeastOrderDaysBefore(fromDate: Date): boolean {
  const selected = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const minAllowed = new Date(
    todayOnly.getFullYear(),
    todayOnly.getMonth(),
    todayOnly.getDate() + this.orderDays
  );

  return selected.getTime() >= minAllowed.getTime();
}


loadSiteSettings(): void {
  this.requestService.getLatestSiteSetting().subscribe({
    next: (res: any) => {
      this.orderDays = Number(res?.data?.orderDays ?? 0);
    },
    error: (err) => {
      console.error('Failed to load site settings', err);
      this.orderDays = 0;
    }
  });
}




openOverride(row: any): void {
  const requestFrom = this.toInputDate(row.fromDate);
  const requestTo = this.toInputDate(row.toDate);

  const reqFromDate = this.parseDateOnly(row.fromDate);
  const reqToDate = this.parseDateOnly(row.toDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minAllowedDateObj = new Date(today);
  minAllowedDateObj.setDate(minAllowedDateObj.getDate() + this.orderDays);

  const getMonthEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getFinalToDate = (fromDate: Date, requestToDate: Date | null): Date => {
    const monthEnd = getMonthEnd(fromDate);

    if (requestToDate && monthEnd.getTime() > requestToDate.getTime()) {
      return requestToDate;
    }

    return monthEnd;
  };

  let finalMinFromDateObj = minAllowedDateObj;

  if (reqFromDate && reqFromDate.getTime() > minAllowedDateObj.getTime()) {
    finalMinFromDateObj = reqFromDate;
  }

  const finalMinFromDate = this.toInputDate(finalMinFromDateObj);
  const initialToDateObj = getFinalToDate(finalMinFromDateObj, reqToDate);
  const initialToDate = this.toInputDate(initialToDateObj);

  Swal.fire({
    title: '',
    html: `
      <div class="override-popup">
        <div class="override-popup__header">
          <div>
            <div class="override-popup__eyebrow">Override Date Selection</div>
            <h2 class="override-popup__title">Select Override Date Range</h2>
            <div class="override-popup__subtitle">
              Request No: <span>${row.requestNo}</span>
            </div>
          </div>
        </div>

        <div class="override-popup__body">
          <div class="override-form-grid">
            <div class="override-field-card">
              <label for="overrideFromDate" class="override-label">From Date</label>
              <div class="override-input-wrap">
                <input
                  id="overrideFromDate"
                  type="date"
                  class="override-input"
                  value="${finalMinFromDate || ''}"
                  min="${finalMinFromDate || ''}"
                  max="${requestTo || ''}"
                />
              </div>
              <div class="override-helper">
                From date must be within request range and at least ${this.orderDays} days from today
              </div>
            </div>

            <div class="override-field-card">
              <label for="overrideToDate" class="override-label">To Date</label>
              <div class="override-input-wrap">
               <input
                id="overrideToDate"
                type="date"
                class="override-input"
                value="${initialToDate || ''}"
                min="${finalMinFromDate || ''}"
                max="${requestTo || ''}"
              />
              </div>
              <div class="override-helper">
                To date is auto-set to month end or request end date
              </div>
            </div>
          </div>

          <div class="override-range-note">
            Allowed Request Range:
            <strong>${this.displayDate(row.fromDate)}</strong>
            to
            <strong>${this.displayDate(row.toDate)}</strong>
          </div>
        </div>
      </div>
    `,
    width: 560,
    showCancelButton: true,
    showCloseButton: true,
    confirmButtonText: 'Open Override',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'override-swal-popup',
      confirmButton: 'override-swal-confirm',
      cancelButton: 'override-swal-cancel',
      closeButton: 'override-swal-close'
    },
    buttonsStyling: false,
    didOpen: () => {
      const fromInput = document.getElementById('overrideFromDate') as HTMLInputElement;
      const toInput = document.getElementById('overrideToDate') as HTMLInputElement;

      if (fromInput && toInput) {
        fromInput.addEventListener('change', () => {
          const selectedFrom = this.parseDateOnly(fromInput.value);

          if (!selectedFrom) {
            toInput.value = '';
            return;
          }

          const autoToDate = getFinalToDate(selectedFrom, reqToDate);
          toInput.min = fromInput.value;
          toInput.max = requestTo || '';
          toInput.value = this.toInputDate(autoToDate);
        });
      }
    },
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

      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + this.orderDays);

      if (selFrom.getTime() < minDate.getTime()) {
        Swal.showValidationMessage(
          `Override/edit must be done at least ${this.orderDays} days before the override from date`
        );
        return false;
      }

      const expectedToDate = getFinalToDate(selFrom, reqTo);

      if (selTo.getTime() !== expectedToDate.getTime()) {
        Swal.showValidationMessage('To date must be the month end within request range');
        return false;
      }

      return { fromDate, toDate };
    }
  } as any).then((result: any) => {
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
        <div class="req-details-popup">
       

          <div class="req-details-info-grid">
            <div class="req-info-box">
              <div class="req-info-label">From Date</div>
              <div class="req-info-value">${this.displayDate(row.fromDate)}</div>
            </div>
            <div class="req-info-box">
              <div class="req-info-label">To Date</div>
              <div class="req-info-value">${this.displayDate(row.toDate)}</div>
            </div>
            <div class="req-info-box">
              <div class="req-info-label">Company</div>
              <div class="req-info-value">${row.companyName || '-'}</div>
            </div>
            <div class="req-info-box">
              <div class="req-info-label">Sessions</div>
              <div class="req-info-value">${Object.keys(groupedDetails).length}</div>
            </div>
          </div>

          <div class="req-details-body">
      `;

      if (!details.length) {
        html += `
          <div class="req-empty-state">
            <div class="req-empty-icon">📄</div>
            <div class="req-empty-title">No line details found</div>
            <div class="req-empty-text">There are no cuisines or locations available for this order.</div>
          </div>
        `;
      } else {
        Object.keys(groupedDetails).forEach((sessionName: string) => {
          const sessionRows = groupedDetails[sessionName];
          const sessionTotal = sessionRows.reduce(
            (sum: number, item: any) => sum + Number(item.qty ?? item.requestedQty ?? item.totalQty ?? 0),
            0
          );

          html += `
            <div class="req-session-card">
              <div class="req-session-header">
                <div class="req-session-title-wrap">
                  <div class="req-session-dot"></div>
                  <div class="req-session-title">${sessionName}</div>
                </div>
                <div class="req-session-badges">
                  <span class="req-badge light">${sessionRows.length} cuisines</span>
                  <span class="req-badge dark">Qty ${sessionTotal}</span>
                </div>
              </div>

              <div class="req-table-wrap">
                <table class="req-details-table">
                  <thead>
                    <tr>
                      <th style="width: 45%;">Cuisine</th>
                      <th style="width: 35%;">Location</th>
                      <th style="width: 20%; text-align:center;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
          `;

          sessionRows.forEach((item: any, index: number) => {
            const qty = item.qty ?? item.requestedQty ?? item.totalQty ?? 0;
            html += `
              <tr>
                <td>
                  <div class="req-cell-main">${item.cuisineName || item.cuisine || '-'}</div>
                 
                </td>
                <td>
                  <div class="req-cell-main">${item.locationName || item.location || '-'}</div>
                </td>
                <td style="text-align:center;">
                  <span class="req-qty-pill">${qty}</span>
                </td>
              </tr>
            `;
          });

          html += `
                  </tbody>
                </table>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;

Swal.fire({
  title: '',
  html,
  width: 940,
  showConfirmButton: false,
  showCloseButton: true,
  customClass: {
    popup: 'req-swal-popup',
    closeButton: 'req-swal-close'
  },
  buttonsStyling: false
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
 isOverrideAllowed(row: any): boolean {
    const reqFrom = this.parseDateOnly(row?.fromDate);
    if (!reqFrom) return false;

    return this.isAtLeastThreeDaysBefore(reqFrom);
  }
isAtLeastThreeDaysBefore(fromDate: Date): boolean {
  const selected = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const minAllowed = new Date(
    todayOnly.getFullYear(),
    todayOnly.getMonth(),
    todayOnly.getDate() + this.orderDays
  );

  return selected.getTime() >= minAllowed.getTime();
}

parseDateOnly(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const str = String(value).trim();

  // yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss
  if (str.includes('-')) {
    const datePart = str.split('T')[0];
    const parts = datePart.split('-');

    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);

      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  }

  // dd-MM-yyyy
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);

      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  }

  return null;
}
toInputDate(value: any): string {
  const d = this.parseDateOnly(value);
  if (!d) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

 private formatDate(value: any): string {
  const d = this.parseDateOnly(value);
  if (!d) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}
getPageEnd(rowCount: number, offset: number, pageSize: number): number {
  const end = (offset + 1) * pageSize;
  return end > rowCount ? rowCount : end;
}
}