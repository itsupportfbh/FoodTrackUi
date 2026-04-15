import {
  Component,
  OnInit,
  AfterViewInit,
  AfterViewChecked
} from '@angular/core';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportService } from './report-service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit, AfterViewChecked {
  userId = 0;
  roleId = 0;
  defaultCompanyId = 0;
  defaultCompanyName = '';

  companies: any[] = [];
  sessions: any[] = [];
  cuisines: any[] = [];
  locations: any[] = [];
  rows: any[] = [];
  foodTotals: any[] = [];
  totalQty = 0;

  companyObjs: any[] = [];
  sessionObjs: any[] = [];
  cuisineObjs: any[] = [];
  locationObjs: any[] = [];

  filter = {
    userId: 0,
    fromDate: '',
    toDate: ''
  };

  showReportPrintModal = false;
  reportPrintLoading = false;
  reportPrintBlob: Blob | null = null;
  reportPrintObjectUrl: string | null = null;
  reportPrintSafeUrl: SafeResourceUrl | null = null;
  sessionCuisineTotals: any[] = [];
  excelLoading = false;
  emailSending = false;
  showEmailPopup = false;

  emailForm = {
    toEmail: '',
    subject: 'Report By Dates',
    body: 'Please find the attached report.'
  };

  constructor(
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.userId = Number(currentUser.id || 0);
      this.roleId = Number(currentUser.roleId || currentUser.RoleId || 0);
      this.defaultCompanyId = Number(currentUser.companyId || 0);
      this.defaultCompanyName = currentUser.companyName || currentUser.CompanyName || '';
    }

    this.filter.userId = this.userId;

    const today = new Date().toISOString().split('T')[0];
    this.filter.fromDate = today;
    this.filter.toDate = today;

    this.loadPageMasters();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  get showCompanyDropdown(): boolean {
    return this.roleId === 1;
  }

  loadPageMasters(): void {
    this.reportService.getPageMasters(this.userId).subscribe({
      next: (res: any) => {
        const data = res?.data || {};

        this.companies = this.cleanMultiSelectItems(data.companies || [], 'All companies');
        this.sessions = this.cleanMultiSelectItems(data.sessions || [], 'All sessions');
        this.cuisines = this.cleanMultiSelectItems(data.cuisines || [], 'All cuisines');
        this.locations = this.cleanMultiSelectItems(data.locations || [], 'All locations');

        this.defaultCompanyId = Number(data?.defaultCompanyId || this.defaultCompanyId || 0);
        this.defaultCompanyName = data?.defaultCompanyName || this.defaultCompanyName || '';

        if (this.roleId === 2 && this.defaultCompanyId > 0) {
          const defaultCompany = this.companies.find(
            (x: any) => Number(x.id) === Number(this.defaultCompanyId)
          );
          this.companyObjs = defaultCompany ? [defaultCompany] : [];
        } else {
          this.companyObjs = [];
        }

        this.sessionObjs = [];
        this.cuisineObjs = [];
        this.locationObjs = [];

        this.loadReport(false);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load page masters', 'error');
      }
    });
  }
  removeSelectedItem(
    listName: 'companyObjs' | 'sessionObjs' | 'cuisineObjs' | 'locationObjs',
    item: any,
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const currentList = this[listName] as any[];
    if (!Array.isArray(currentList)) return;

    this[listName] = currentList.filter(
      (x: any) => Number(x?.id) !== Number(item?.id)
    ) as never[];
  }

  private getSelectedIds(list: any[]): number[] | null {
    if (!list || list.length === 0) return null;

    const ids = list
      .map((x: any) => Number(x?.id))
      .filter((id: number) => !isNaN(id) && id > 0);

    return ids.length ? ids : null;
  }

  private getNames(list: any[], emptyText: string): string {
    if (!list || list.length === 0) return emptyText;
    return list.map((x: any) => x?.name).filter(Boolean).join(', ');
  }

  loadReport(showNoDataMessage: boolean = true): void {
    const payload = this.buildPayload();

    this.reportService.getReportByDates(payload).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.foodTotals = res?.foodTotals || [];
        this.totalQty = this.foodTotals.reduce(
          (sum: number, x: any) => sum + Number(x.totalQty || 0),
          0
        );

        this.buildSessionCuisineTotals();

        if (showNoDataMessage && this.rows.length === 0) {
          const fromText = this.formatDateOnly(this.filter.fromDate);
          const toText = this.formatDateOnly(this.filter.toDate);

          Swal.fire(
            'Warning',
            `No data available between ${fromText} and ${toText}.`,
            'warning'
          );
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err?.error?.message || err?.error || 'Failed to load report', 'error');
      }
    });
  }

  resetFilters(): void {
    const today = new Date().toISOString().split('T')[0];

    this.filter.fromDate = today;
    this.filter.toDate = today;

    this.sessionObjs = [];
    this.cuisineObjs = [];
    this.locationObjs = [];

    if (this.roleId === 1) {
      this.companyObjs = [];
    } else {
      const defaultCompany = this.companies.find(
        (x: any) => Number(x.id) === Number(this.defaultCompanyId)
      );
      this.companyObjs = defaultCompany ? [defaultCompany] : [];
    }

    this.loadReport(false);
  }

  printReport(): void {
    if (!this.rows || this.rows.length === 0) {
      Swal.fire('Info', 'No data available to print', 'info');
      return;
    }

    try {
      const html = this.buildPrintableHtml();
      const printWindow = window.open('', '_blank', 'width=1200,height=800');

      if (!printWindow) {
        Swal.fire('Info', 'Popup blocked. Please allow popups for printing.', 'info');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to print report', 'error');
    }
  }

  private buildPrintableHtml(): string {
    const companyText =
      this.roleId === 2
        ? (this.defaultCompanyName || this.getNames(this.companyObjs, 'All Companies'))
        : this.getNames(this.companyObjs, 'All Companies');

    const sessionText = this.getNames(this.sessionObjs, 'All Sessions');
    const cuisineText = this.getNames(this.cuisineObjs, 'All Cuisines');
    const locationText = this.getNames(this.locationObjs, 'All Locations');
    const fromDateText = this.formatDateOnly(this.filter.fromDate);
    const toDateText = this.formatDateOnly(this.filter.toDate);

    const sessionCuisineCardsHtml = (this.sessionCuisineTotals || [])
      .map(
        (session: any) => `
          <div class="session-summary-card">
            <div class="session-summary-head">
              <div class="session-summary-name">${this.escapeHtml(session.sessionName || '')}</div>
              <div class="session-summary-total">Total: ${Number(session.totalQty || 0)}</div>
            </div>

            <div class="session-summary-list">
              ${(session.cuisines || [])
                .map(
                  (item: any) => `
                    <div class="session-summary-item">
                      <span>${this.escapeHtml(item.cuisineName || '')}</span>
                      <strong>${Number(item.totalQty || 0)}</strong>
                    </div>
                  `
                )
                .join('')}
            </div>
          </div>
        `
      )
      .join('');

    const rowsHtml = (this.rows || [])
      .map(
        (row: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(row.companyName || '')}</td>
            <td>${this.formatDateOnly(row.reportDate)}</td>
            <td>${this.escapeHtml(row.sessionName || '')}</td>
            <td>${this.escapeHtml(row.cuisineName || '')}</td>
            <td>${this.escapeHtml(row.locationName || '')}</td>
            <td class="text-right">${Number(row.count || 0)}</td>
          </tr>
        `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Report By Dates</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 24px;
            color: #2f2f2f;
            background: #ffffff;
          }
          .report-header {
            margin-bottom: 20px;
            border-bottom: 2px solid #7367f0;
            padding-bottom: 12px;
          }
          .report-title {
            margin: 0 0 6px;
            font-size: 26px;
            color: #7367f0;
            font-weight: 700;
          }
          .report-subtitle {
            margin: 0;
            font-size: 14px;
            color: #777;
          }
          .filter-box {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 20px;
            background: #fafafe;
          }
          .filter-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px 18px;
          }
          .filter-item { font-size: 13px; }
          .filter-label {
            font-weight: 700;
            color: #555;
            margin-bottom: 4px;
          }
          .filter-value { color: #222; }
          .summary-section { margin-bottom: 20px; }
          .summary-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .summary-head h3 {
            margin: 0;
            font-size: 18px;
            color: #444;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
          .session-summary-card {
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 14px;
            background: #fcfcff;
            break-inside: avoid;
          }
          .session-summary-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ece9f6;
          }
          .session-summary-name {
            font-size: 18px;
            font-weight: 700;
            color: #4b4563;
          }
          .session-summary-total {
            font-size: 13px;
            font-weight: 700;
            color: #7367f0;
            background: #efeefe;
            padding: 6px 12px;
            border-radius: 999px;
          }
          .session-summary-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .session-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #ececec;
            border-radius: 8px;
            padding: 10px 12px;
            background: #fff;
            font-size: 14px;
            color: #555;
          }
          .session-summary-item strong {
            color: #7367f0;
            font-size: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          thead th {
            background: #7367f0;
            color: #fff;
            font-size: 13px;
            text-align: left;
            padding: 10px;
            border: 1px solid #dcdcdc;
          }
          tbody td {
            font-size: 13px;
            padding: 10px;
            border: 1px solid #e3e3e3;
          }
          tbody tr:nth-child(even) {
            background: #fafafa;
          }
          .text-right { text-align: right; }

          @media print {
            body { padding: 10px; }
            .filter-box,
            .session-summary-card,
            table {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1 class="report-title">Report By Dates</h1>
          <p class="report-subtitle">Company-wise food request report</p>
        </div>

        <div class="filter-box">
          <div class="filter-grid">
            <div class="filter-item">
              <div class="filter-label">Company</div>
              <div class="filter-value">${this.escapeHtml(companyText)}</div>
            </div>
            <div class="filter-item">
              <div class="filter-label">From Date</div>
              <div class="filter-value">${this.escapeHtml(fromDateText)}</div>
            </div>
            <div class="filter-item">
              <div class="filter-label">To Date</div>
              <div class="filter-value">${this.escapeHtml(toDateText)}</div>
            </div>
            <div class="filter-item">
              <div class="filter-label">Session</div>
              <div class="filter-value">${this.escapeHtml(sessionText)}</div>
            </div>
            <div class="filter-item">
              <div class="filter-label">Cuisine</div>
              <div class="filter-value">${this.escapeHtml(cuisineText)}</div>
            </div>
            <div class="filter-item">
              <div class="filter-label">Location</div>
              <div class="filter-value">${this.escapeHtml(locationText)}</div>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-head">
            <h3>Session & Cuisine Totals</h3>
          </div>
          <div class="summary-grid">
            ${sessionCuisineCardsHtml}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Company</th>
              <th>Date</th>
              <th>Session</th>
              <th>Cuisine</th>
              <th>Location</th>
              <th class="text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private formatDateOnly(value: any): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildSessionCuisineTotals(): void {
    const grouped: any = {};

    (this.rows || []).forEach((row: any) => {
      const session = row.sessionName || 'Unknown Session';
      const cuisine = row.cuisineName || 'Unknown Cuisine';
      const count = Number(row.count || 0);

      if (!grouped[session]) {
        grouped[session] = {
          sessionName: session,
          totalQty: 0,
          items: {}
        };
      }

      if (!grouped[session].items[cuisine]) {
        grouped[session].items[cuisine] = 0;
      }

      grouped[session].items[cuisine] += count;
      grouped[session].totalQty += count;
    });

    this.sessionCuisineTotals = Object.values(grouped).map((sessionGroup: any) => {
      return {
        sessionName: sessionGroup.sessionName,
        totalQty: sessionGroup.totalQty,
        cuisines: Object.keys(sessionGroup.items).map((cuisineName: string) => ({
          cuisineName,
          totalQty: sessionGroup.items[cuisineName]
        }))
      };
    });
  }

  downloadExcel(): void {
    if (!this.rows || this.rows.length === 0) {
      Swal.fire('Info', 'No data available to download', 'info');
      return;
    }

    this.excelLoading = true;

    this.reportService.exportReportExcel(this.buildPayload()).subscribe({
      next: (blob: Blob) => {
        this.excelLoading = false;

        if (!blob || blob.size === 0) {
          Swal.fire('Info', 'Excel file is empty', 'info');
          return;
        }

        const fileName = `CSPL_ReportByDates_${this.getDateFileText()}.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = fileName;
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.excelLoading = false;
        console.error(err);
        Swal.fire('Error', err?.error?.message || 'Failed to download excel', 'error');
      }
    });
  }

  openEmailPopup(): void {
    if (!this.rows || this.rows.length === 0) {
      Swal.fire('Info', 'No data available to mail', 'info');
      return;
    }

    this.emailForm = {
      toEmail: '',
      subject: 'CSPL Food Track Report | Date-wise Summary',
      body: [
        'Dear Sir/Madam,',
        '',
        'Greetings from CSPL.',
        '',
        'Please find attached the Food Track date-wise report for your review.',
        '',
        'This report includes the requested data based on the selected filters and date range.',
        '',
        'Regards,',
        'CSPL Team'
      ].join('<br>')
    };

    this.showEmailPopup = true;
    setTimeout(() => feather.replace());
  }

  closeEmailPopup(): void {
    this.showEmailPopup = false;
  }

  sendReportEmail(): void {
    if (!this.emailForm.toEmail || !this.isValidEmail(this.emailForm.toEmail)) {
      Swal.fire('Missing Information', 'Please enter a valid email address', 'warning');
      return;
    }

    if (!this.rows || this.rows.length === 0) {
      Swal.fire('Info', 'No data available to mail', 'info');
      return;
    }

    const payload = {
      ...this.buildPayload(),
      toEmail: this.emailForm.toEmail,
      subject: this.emailForm.subject || 'Report By Dates',
      body: this.emailForm.body || 'Please find the attached report.'
    };

    this.emailSending = true;

    this.reportService.sendReportEmail(payload).subscribe({
      next: (res: any) => {
        this.emailSending = false;
        this.showEmailPopup = false;
        Swal.fire('Success', res?.message || 'Report mail sent successfully', 'success');
      },
      error: (err) => {
        this.emailSending = false;
        console.error(err);
        Swal.fire('Error', err?.error?.message || 'Failed to send report mail', 'error');
      }
    });
  }

  private buildPayload(): any {
    const companyIds = this.roleId === 2
      ? (this.defaultCompanyId > 0 ? [this.defaultCompanyId] : null)
      : this.getSelectedIds(this.companyObjs);

    return {
      userId: this.userId,
      fromDate: this.filter.fromDate || null,
      toDate: this.filter.toDate || null,

      companyIds,
      sessionIds: this.getSelectedIds(this.sessionObjs),
      cuisineIds: this.getSelectedIds(this.cuisineObjs),
      locationIds: this.getSelectedIds(this.locationObjs),

      companyId: null,
      sessionId: null,
      cuisineId: null,
      locationId: null
    };
  }

  private getDateFileText(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let companyText = 'AllCompanies';

    if (this.roleId === 2) {
      companyText = this.defaultCompanyName || 'Company';
    } else if (this.companyObjs?.length) {
      companyText = this.companyObjs.map((x: any) => x.name).join('_');
    }

    companyText = String(companyText).replace(/[^a-zA-Z0-9_-]/g, '_');

    return `${day}-${month}-${year}-${companyText}`;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  openDatePicker(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    input.focus();

    const pickerInput = input as any;
    if (pickerInput.showPicker) {
      pickerInput.showPicker();
    }
  }

  private cleanMultiSelectItems(items: any[], allText: string): any[] {
    if (!Array.isArray(items)) return [];

    return items.filter((x: any) => {
      const id = x?.id;
      const name = String(x?.name || '').trim().toLowerCase();
      const allName = allText.trim().toLowerCase();

      if (id === null || id === undefined || id === '' || Number(id) === 0) {
        return false;
      }

      if (name === allName) {
        return false;
      }

      return true;
    });
  }
}