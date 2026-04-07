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

  companies: any[] = [];
  sessions: any[] = [];
  cuisines: any[] = [];
  locations: any[] = [];
  rows: any[] = [];
  foodTotals: any[] = [];
  totalQty = 0;

  companyObj: any = null;
  sessionObj: any = null;
  cuisineObj: any = null;
  locationObj: any = null;

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

        this.companies = data.companies || [];
        this.sessions = data.sessions || [];
        this.cuisines = data.cuisines || [];
        this.locations = data.locations || [];

        if (this.roleId === 2) {
          this.companyObj =
            this.companies.find(
              (x: any) => Number(x.id) === Number(data?.defaultCompanyId || this.defaultCompanyId)
            ) || null;
        }

        this.loadReport();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load page masters', 'error');
      }
    });
  }

  loadReport(): void {
    const payload = {
      userId: this.userId,
      companyId: this.companyObj ? Number(this.companyObj.id) : null,
      fromDate: this.filter.fromDate || null,
      toDate: this.filter.toDate || null,
      sessionId: this.sessionObj ? Number(this.sessionObj.id) : null,
      cuisineId: this.cuisineObj ? Number(this.cuisineObj.id) : null,
      locationId: this.locationObj ? Number(this.locationObj.id) : null
    };

    this.reportService.getReportByDates(payload).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.foodTotals = res?.foodTotals || [];
        this.totalQty = this.foodTotals.reduce(
          (sum: number, x: any) => sum + Number(x.totalQty || 0),
          0
        );
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err?.error || 'Failed to load report', 'error');
      }
    });
  }

  resetFilters(): void {
    const today = new Date().toISOString().split('T')[0];

    this.filter.fromDate = today;
    this.filter.toDate = today;
    this.sessionObj = null;
    this.cuisineObj = null;
    this.locationObj = null;

    if (this.roleId === 1) {
      this.companyObj = null;
    } else {
      this.companyObj =
        this.companies.find((x: any) => Number(x.id) === Number(this.defaultCompanyId)) || null;
    }

    this.loadReport();
  }

  openReportPrintPreview(): void {
    if (!this.rows.length) {
      Swal.fire('Info', 'No data available to print', 'info');
      return;
    }

    this.showReportPrintModal = true;
    this.lockBodyScroll();
    this.reportPrintLoading = true;
    this.clearReportPreview();

    try {
      const html = this.buildPrintableHtml();
      this.reportPrintBlob = new Blob([html], { type: 'text/html' });

      const url = URL.createObjectURL(this.reportPrintBlob);
      this.reportPrintObjectUrl = url;

      setTimeout(() => {
        this.reportPrintSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.reportPrintLoading = false;
      }, 30);
    } catch (e) {
      this.reportPrintLoading = false;
      Swal.fire('Error', 'Failed to prepare print preview', 'error');
    }
  }

  closeReportPrintModal(): void {
    this.showReportPrintModal = false;
    this.reportPrintLoading = false;
    this.clearReportPreview();
    this.unlockBodyScroll();
  }

  printCurrentReport(): void {
    if (!this.reportPrintBlob) return;

    const url = URL.createObjectURL(this.reportPrintBlob);
    const w = window.open(url, '_blank');
    if (!w) {
      Swal.fire({ icon: 'info', title: 'Popup blocked', text: 'Allow popups to print.' });
      URL.revokeObjectURL(url);
      return;
    }

    w.onload = () => {
      w.focus();
      w.print();
    };

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  downloadCurrentReport(): void {
    if (!this.reportPrintBlob) return;

    const fileName = `Report_By_Dates_${this.filter.fromDate || 'Report'}.html`;
    const url = URL.createObjectURL(this.reportPrintBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  private buildPrintableHtml(): string {
    return '';
  }

  private clearReportPreview(): void {
    if (this.reportPrintObjectUrl) {
      URL.revokeObjectURL(this.reportPrintObjectUrl);
      this.reportPrintObjectUrl = null;
    }

    this.reportPrintSafeUrl = null;
    this.reportPrintBlob = null;
  }

  private lockBodyScroll(): void {
    document.body.classList.add('modal-open-no-scroll');
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('modal-open-no-scroll');
  }
}