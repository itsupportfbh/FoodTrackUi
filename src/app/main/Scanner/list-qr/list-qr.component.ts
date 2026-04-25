import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { ScannerService } from '../scannerservice';

@Component({
  selector: 'app-list-qr',
  templateUrl: './list-qr.component.html',
  styleUrls: ['./list-qr.component.scss']
})
export class ListQRComponent implements OnInit, AfterViewInit, AfterViewChecked {
  rows: any[] = [];
  filteredRows: any[] = [];

  searchText = '';
  selectedOption = 10;

  userId = 0;
  companyId = 0;
  isAdmin = false;
  roleId = 0;
  loading = false;

  currentPage = 1;

  constructor(
    private router: Router,
    private scannerService: ScannerService
  ) {}

  ngOnInit(): void {
    this.getCurrentUserData();
    this.loadQrList();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  get canManageOrders(): boolean {
    return this.roleId !== 1;
  }

  get totalPages(): number {
    const total = this.filteredRows.length;
    const size = Number(this.selectedOption) || 10;
    return total > 0 ? Math.ceil(total / size) : 0;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedRows(): any[] {
    const startIndex = (this.currentPage - 1) * this.selectedOption;
    const endIndex = startIndex + this.selectedOption;
    return this.filteredRows.slice(startIndex, endIndex);
  }

  get startRecord(): number {
    if (this.filteredRows.length === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.selectedOption + 1;
  }

  get endRecord(): number {
    if (this.filteredRows.length === 0) {
      return 0;
    }
    return Math.min(this.currentPage * this.selectedOption, this.filteredRows.length);
  }

  getCurrentUserData(): void {
    try {
      const currentUserRaw = localStorage.getItem('currentUser');

      if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        this.userId = Number(currentUser.id || currentUser.userId || 0);
        this.companyId = Number(currentUser.companyId || 0);
        this.roleId = Number(currentUser.roleId || currentUser.RoleId || 0);
      }

      const role = (localStorage.getItem('role') || '').toLowerCase();
      this.isAdmin = role.includes('admin');
    } catch (error) {
      console.error('Current user parse error:', error);
      this.userId = 0;
      this.companyId = 0;
      this.roleId = 0;
      this.isAdmin = false;
    }
  }

  loadQrList(): void {
    this.loading = true;

    const payload = {
      userId: this.userId,
      companyId: this.companyId,
      isAdmin: this.isAdmin
    };

    this.scannerService.getallQR(payload).subscribe({
      next: (res: any) => {
        console.log('QR LIST RESPONSE:', res);

        const data = Array.isArray(res) ? res : (res?.data || []);

       this.rows = data.map((item: any) => ({
  id: item.id,
  companyId: item.companyId,
  companyName: item.companyName,
  companyEmail: item.companyEmail,
  requestId: item.requestId,
  requestNo: item.requestNo,
  noofQR: item.noofQR,
  qrValidFrom: item.qrValidFrom,
  qrValidTill: item.qrValidTill,
  approvalStatus: item.approvalStatus,
  requestedBy: item.requestedBy,
  requestedDate: item.requestedDate,
  approvedBy: item.approvedBy,
  approvedDate: item.approvedDate,
  qrImageBase64: item.qrImageBase64 || null,
  qrImages: Array.isArray(item.qrImages) ? item.qrImages : []
}));

        this.filteredRows = [...this.rows];
        this.currentPage = 1;
        this.loading = false;

        feather.replace();

        console.log('API DATA:', data);
        console.log('MAPPED ROWS:', this.rows);
        console.log('NO OF QR VALUES:', this.rows.map(x => x.noofQR));
      },
      error: (err: any) => {
        this.loading = false;
        console.error('QR LIST ERROR:', err);
        Swal.fire('Error', err?.error?.message || 'Failed to load QR list', 'error');
      }
    });
  }
approveQr(row: any): void {
  Swal.fire({
    title: 'Approve QR Request?',
    text: `Approve QR for ${row.companyName}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Approve',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: 'Approving...',
      text: 'Please wait while approving the QR request.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false
    } as any);

    Swal.showLoading();

    this.scannerService.approveQrRequest(row.id, this.userId).subscribe({
      next: (res: any) => {
        Swal.close();

        const response = res?.message || {};
        const isSuccess = response?.isSuccess === true;
        const msg = response?.message || 'QR request approved successfully';
        const data = response?.data || {};

        if (isSuccess) {
          Swal.fire({
            title: 'Success',
            text: msg,
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            allowOutsideClick: false
          });

          this.loadQrList();
        } else {
          Swal.fire({
            title: 'Warning',
            text: msg || 'QR cannot be generated',
            icon: 'warning',
            confirmButtonText: 'OK'
          }).then(() => {
            if (data?.companyId) {
              this.router.navigate(['users/users-list'], {
                queryParams: { companyId: data.companyId }
              });
            }
          });
        }
      },
      error: (err: any) => {
        Swal.close();

        Swal.fire({
          title: 'Error',
          text: err?.error?.message || 'Failed to approve QR request',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  });
}
rejectQr(row: any): void {
  Swal.fire({
    title: 'Reject QR Request',
    text: 'Enter rejection reason',
    input: 'text',
    inputPlaceholder: 'Enter rejection reason',
    inputValidator: (value: string) => {
      if (!value || !value.trim()) {
        return 'Reason is required';
      }
      return null;
    },
    showCancelButton: true,
    confirmButtonText: 'Reject',
    cancelButtonText: 'Cancel'
  }).then((result: any) => {
    if (!result.isConfirmed) return;

    const payload = {
      rejectedBy: this.userId,
      reason: result.value?.trim()
    };

    this.scannerService.rejectQrRequest(row.id, payload).subscribe({
      next: (res: any) => {
        Swal.fire({
        title: 'Success',
        text: res?.message || 'QR request rejected successfully',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
        allowOutsideClick: false
      });
        this.loadQrList();
      },
      error: (err: any) => {
        Swal.fire('Error', err?.error?.message || 'Failed to reject QR request', 'error');
      }
    });
  });
}
  sendMail(row: any): void {
    console.log('MAIL ROW:', row);

    const payload = {
      id: row.id,
      requestId: row.requestId,
      companyId: row.companyId,
      email: row.companyEmail
    };

    console.log('MAIL PAYLOAD:', payload);

    this.scannerService.sendQrEmail(payload).subscribe({
      next: (res: any) => {
        console.log('MAIL SUCCESS:', res);
        Swal.fire('Success', res?.message || 'Mail sent successfully', 'success');
      },
      error: (err: any) => {
        console.error('MAIL ERROR:', err);
        console.error('MAIL ERROR BODY:', err?.error);
        Swal.fire('Error', err?.error?.message || 'Failed to send mail', 'error');
      }
    });
  }

 downloadFile(row: any): void {
  const qrCodeRequestId = row?.qrCodeRequestId || row?.id || 0;

  if (!qrCodeRequestId) {
    console.error('Invalid row data:', row);
    Swal.fire('Info', 'QR Code Request Id not found', 'info');
    return;
  }

  this.scannerService.downloadQrZip(qrCodeRequestId).subscribe({
    next: (blob: Blob) => {
      if (!blob || blob.size === 0) {
        Swal.fire('Info', 'ZIP file is empty', 'info');
        return;
      }

      const companyName = this.sanitizeFileName(row?.companyName || 'Company');
      const requestNo = this.sanitizeFileName(row?.requestNo || 'qr-images');
      const fileName = `CSPL-${companyName}-${requestNo}.zip`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      Swal.fire({
      title: 'Success',
      text: 'ZIP downloaded successfully',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
      allowOutsideClick: false
    });
    },
    error: (err: any) => {
      console.error('ZIP DOWNLOAD ERROR:', err);
      Swal.fire('Error', 'Failed to download ZIP file', 'error');
    }
  });
}

private sanitizeFileName(value: string): string {
  return String(value || '')
    .trim()
    .replace(/[\/\\:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

  filterRequests(): void {
    const text = (this.searchText || '').trim().toLowerCase();

    if (!text) {
      this.filteredRows = [...this.rows];
      this.currentPage = 1;
      return;
    }

    this.filteredRows = this.rows.filter((x: any) => {
      const qtyText = String(x.noofQR ?? x.NoofQR ?? x.noOfQR ?? '')
        .trim()
        .toLowerCase();

      return (
        String(x.id ?? '').toLowerCase().includes(text) ||
        String(x.requestId ?? '').toLowerCase().includes(text) ||
        String(x.requestNo ?? '').toLowerCase().includes(text) ||
        String(x.companyName ?? '').toLowerCase().includes(text) ||
        String(x.companyEmail ?? '').toLowerCase().includes(text) ||
        qtyText.includes(text) ||
        this.displayDate(x.qrValidFrom).toLowerCase().includes(text) ||
        this.displayDate(x.qrValidTill).toLowerCase().includes(text)
      );
    });

    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;

    setTimeout(() => {
      feather.replace();
    }, 0);
  }

  openCreate(): void {
    this.router.navigate(['scanner/qrgenerate']);
  }

  viewRequestDetails(row: any): void {
    const html = `
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
          <div><b>Request No</b> : ${row.requestNo || '-'}</div>
          <div><b>Company</b> : ${row.companyName || '-'}</div>
          <div><b>Email</b> : ${row.companyEmail || '-'}</div>
          <div><b>No Of QR</b> : ${row.noofQR ?? 0}</div>
          <div><b>QR Valid From</b> : ${this.displayDate(row.qrValidFrom)}</div>
          <div><b>QR Valid Till</b> : ${this.displayDate(row.qrValidTill)}</div>
        </div>
      </div>
    `;

    Swal.fire({
      title: `QR Details - ${row.requestNo || row.id}`,
      html,
      width: 850,
      confirmButtonText: 'Close',
      confirmButtonColor: '#7367f0'
    });
  }

  private parseDateOnly(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [y, m, d] = text.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }

    return null;
  }

  displayDate(value: any): string {
    const dt = this.parseDateOnly(value);
    if (!dt) return '-';

    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }
}