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

  breakfastCutOffTime = '';
  lunchCutOffTime = '';
  lateLunchCutOffTime = '';
  dinnerCutOffTime = '';
  lateDinnerCutOffTime = '';

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
  planRateCards: any[] = [];

  plans: string[] = ['Basic', 'Standard', 'Premium'];
  selectedPlans: string[] = [];
  planGroups: any[] = [];

  lockedPlanTypes: string[] = [];
  originalLines: any[] = [];

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

        this.orderDays = Number(data.orderDays || 0);
        this.minDate = this.getDateAfterDays(this.orderDays);

        this.breakfastCutOffTime = data.breakfastCutOffTime || data.BreakfastCutOffTime || '';
        this.lunchCutOffTime = data.lunchCutOffTime || data.LunchCutOffTime || '';
        this.lateLunchCutOffTime = data.lateLunchCutOffTime || data.LateLunchCutOffTime || '';
        this.dinnerCutOffTime = data.dinnerCutOffTime || data.DinnerCutOffTime || '';
        this.lateDinnerCutOffTime = data.lateDinnerCutOffTime || data.LateDinnerCutOffTime || '';

        this.loadPlanRateCards();

        if (!this.isEditMode && this.companies.length > 0) {
          this.model.companyId = Number(this.companies[0].id || 0);
          this.model.companyName = this.companies[0].name || '';
        }

        if (this.isEditMode) {
          this.loadById();
        } else {
          this.buildPlanGroups();
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
          planType: row.planType || '',
          isActive: row.isActive ?? true,
          lines: row.lines || []
        };

        this.originalLines = JSON.parse(JSON.stringify(this.model.lines || []));

        this.updateToDateMax();

        if (!this.model.companyName) {
          const company = this.companies.find((x: any) => Number(x.id) === Number(this.model.companyId));
          this.model.companyName = company ? company.name : '';
        }

        this.patchExistingLinesToGroups();
        this.calculateTotalQty();
        this.loadLockedPlanTypes();

        setTimeout(() => feather.replace());
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load request details', 'error');
      }
    });
  }

  loadLockedPlanTypes(): void {
    if (!this.isEditMode || this.id <= 0) {
      this.lockedPlanTypes = [];
      return;
    }

    this.requestService.getLockedPlanTypes(this.id).subscribe({
      next: (res: any) => {
        const data = res?.data || [];

        this.lockedPlanTypes = data
          .map((x: any) => String(x.planType || '').trim().toLowerCase())
          .filter((x: string) => x);

        setTimeout(() => feather.replace());
      },
      error: () => {
        this.lockedPlanTypes = [];
      }
    });
  }

  isPlanLocked(planType: string): boolean {
    return this.lockedPlanTypes.includes(
      String(planType || '').trim().toLowerCase()
    );
  }

  buildPlanGroups(): void {
    this.planGroups = this.selectedPlans.map((plan: string, index: number) => {
      const lines = this.cuisines.map((cuisine: any) => ({
        id: 0,
        planType: plan,
        cuisineId: Number(cuisine.id || 0),
        cuisineName: cuisine.name || '',
        qty: 0
      }));

      return {
        planType: plan,
        isOpen: index === 0,
        lines
      };
    });
  }

  patchExistingLinesToGroups(): void {
    const existingLines = this.model.lines || [];

    if (!existingLines.length) {
      this.selectedPlans = [];
      this.buildPlanGroups();
      return;
    }

    this.selectedPlans = existingLines
      .map((x: any) => x.planType || x.PlanType)
      .filter((plan: string, index: number, arr: string[]) =>
        plan && arr.indexOf(plan) === index
      );

    this.buildPlanGroups();

    this.planGroups.forEach(group => {
      group.lines.forEach(line => {
        const match = existingLines.find(
          (x: any) =>
            String(x.planType || x.PlanType || '').toLowerCase() === String(group.planType || '').toLowerCase() &&
            Number(x.cuisineId || x.CuisineId) === Number(line.cuisineId)
        );

        if (match) {
          line.id = Number(match.id || match.Id || 0);
          line.qty = Number(match.qty || match.Qty || 0);
        }
      });
    });
  }

  toggleAccordion(group: any): void {
    group.isOpen = !group.isOpen;
    setTimeout(() => feather.replace());
  }

  onLineChange(): void {
    this.syncLinesFromGroups();
    this.calculateTotalQty();
  }

  syncLinesFromGroups(): void {
    const currentLines = this.planGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .filter((x: any) => Number(x.qty) > 0)
      .map((x: any) => ({
        Id: x.id || 0,
        PlanType: x.planType,
        CuisineId: x.cuisineId,
        Qty: Number(x.qty) || 0
      }));

    if (!this.isEditMode || this.lockedPlanTypes.length === 0) {
      this.model.lines = currentLines;
      return;
    }

    const lockedOriginalLines = (this.originalLines || [])
      .filter((x: any) => this.isPlanLocked(x.planType || x.PlanType))
      .map((x: any) => ({
        Id: x.id || x.Id || 0,
        PlanType: x.planType || x.PlanType,
        CuisineId: x.cuisineId || x.CuisineId,
        Qty: Number(x.qty || x.Qty || 0)
      }));

    const unlockedCurrentLines = currentLines
      .filter((x: any) => !this.isPlanLocked(x.PlanType));

    this.model.lines = [
      ...lockedOriginalLines,
      ...unlockedCurrentLines
    ];
  }

  calculateTotalQty(): void {
    this.model.totalQty = this.planGroups
      .reduce((acc: any[], group: any) => acc.concat(group.lines || []), [])
      .reduce((sum: number, line: any) => sum + (Number(line.qty) || 0), 0);
  }

  onPlanToggle(plan: string, event: any): void {
    if (this.isEditMode && this.isPlanLocked(plan)) {
      event.target.checked = true;
      return;
    }

    if (event.target.checked) {
      if (!this.selectedPlans.includes(plan)) {
        this.selectedPlans.push(plan);
      }
    } else {
      this.selectedPlans = this.selectedPlans.filter(p => p !== plan);
    }

    const existing = this.planGroups;
    this.buildPlanGroups();

    this.planGroups.forEach(group => {
      const oldGroup = existing.find(g => g.planType === group.planType);
      if (oldGroup) {
        group.lines.forEach(line => {
          const oldLine = oldGroup.lines.find((l: any) => Number(l.cuisineId) === Number(line.cuisineId));
          if (oldLine) {
            line.id = oldLine.id || 0;
            line.qty = oldLine.qty || 0;
          }
        });
      }
    });

    this.onLineChange();
    setTimeout(() => feather.replace());
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

    if (!this.selectedPlans.length) {
      Swal.fire('Missing', 'Please select at least one plan', 'warning');
      return;
    }

    this.syncLinesFromGroups();
    this.calculateTotalQty();

    const validLines = this.model.lines || [];

    if (!validLines.length) {
      Swal.fire('Missing Information', 'Please enter qty for at least one cuisine', 'warning');
      return;
    }

    if (this.isDateOverlap) {
      Swal.fire('Warning', 'Order already exists for the selected date range.', 'warning');
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
        Swal.fire({
          title: 'Success',
          text: res?.message || 'Request saved successfully',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          allowOutsideClick: false
        }).then(() => {
          this.router.navigate(['/catering/request']);
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err?.error?.message || err?.error || 'Save failed', 'error');
      }
    });
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

    this.selectedPlans = [];
    this.buildPlanGroups();
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
          this.dateOverlapMessage = 'Order already exists for the selected date range.';
          Swal.fire('Warning', this.dateOverlapMessage, 'warning');
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  loadPlanRateCards(): void {
    this.requestService.getDefaultPlanRates().subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];

        this.planRateCards = (data || []).map((plan: any) => ({
          planType: plan.planType,
          effectiveFrom: plan.effectiveFrom,
          sessionRates: (plan.sessionRates || [])
            .filter((rate: any) => {
              const name = rate.sessionName || this.getSessionName(rate.sessionId);
              return !this.isLateLunch(name) && !this.isLateDinner(name);
            })
            .map((rate: any) => ({
              sessionId: Number(rate.sessionId || 0),
              sessionName: rate.sessionName || this.getSessionName(rate.sessionId),
              rate: Number(rate.rate || 0)
            }))
        }));
      },
      error: (err: any) => {
        console.error(err);
        this.planRateCards = [];
      }
    });
  }

  normalizeText(value: string): string {
    return (value || '').toLowerCase().replace(/[\s_-]/g, '').trim();
  }

  isLateLunch(name: string): boolean {
    return this.normalizeText(name) === 'latelunch';
  }

  isLateDinner(name: string): boolean {
    return this.normalizeText(name) === 'latedinner';
  }

  getPreviewPerDay(plan: any): number {
    return (plan.sessionRates || []).reduce(
      (sum: number, x: any) => sum + Number(x.rate || 0),
      0
    );
  }

  getPreviewMonthly(plan: any): number {
    return this.getPreviewPerDay(plan) * 30;
  }

  toDisplayDate(value: any): string {
    if (!value) return '-';

    const d = new Date(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }

  getSessionName(sessionId: number): string {
    const session = this.sessions.find((x: any) => Number(x.id) === Number(sessionId));
    return session ? session.name : '';
  }

  private getSessionCutOffTime(sessionId: number, sessionName?: string): string {
    const id = Number(sessionId || 0);
    const name = (sessionName || '').toLowerCase().trim();

    if (name === 'breakfast') return this.breakfastCutOffTime;
    if (name === 'lunch') return this.lunchCutOffTime;
    if (name === 'late lunch' || name === 'latelunch') return this.lateLunchCutOffTime;
    if (name === 'dinner') return this.dinnerCutOffTime;
    if (name === 'late dinner' || name === 'latedinner') return this.lateDinnerCutOffTime;

    if (id === 1) return this.lunchCutOffTime;
    if (id === 2) return this.breakfastCutOffTime;
    if (id === 3) return this.lateLunchCutOffTime;
    if (id === 4) return this.dinnerCutOffTime;
    if (id === 5) return this.lateDinnerCutOffTime;

    return '';
  }

  private getTodayDateString(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseTimeToMinutes(timeValue: string): number | null {
    if (!timeValue) return null;

    const value = String(timeValue).trim().toUpperCase();

    const format24 = value.match(/^(\d{1,2}):(\d{2})$/);
    if (format24) {
      const hour = Number(format24[1]);
      const minute = Number(format24[2]);

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return hour * 60 + minute;
      }

      return null;
    }

    const format12 = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (format12) {
      let hour = Number(format12[1]);
      const minute = Number(format12[2]);
      const meridian = format12[3];

      if (minute < 0 || minute > 59 || hour < 1 || hour > 12) {
        return null;
      }

      if (meridian === 'PM' && hour < 12) hour += 12;
      if (meridian === 'AM' && hour === 12) hour = 0;

      return hour * 60 + minute;
    }

    return null;
  }

  isSessionCutOffCrossed(sessionId: number, sessionName?: string): boolean {
    if (!this.model?.fromDate) return false;

    const todayStr = this.getTodayDateString();

    if (this.model.fromDate !== todayStr) return false;

    const cutOff = this.getSessionCutOffTime(sessionId, sessionName);
    if (!cutOff) return false;

    const cutOffMinutes = this.parseTimeToMinutes(cutOff);
    if (cutOffMinutes === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes > cutOffMinutes;
  }

  getSessionCutOffMessage(sessionId: number, sessionName?: string): string {
    const cutOff = this.getSessionCutOffTime(sessionId, sessionName);
    const label = sessionName || `Session ${sessionId}`;

    if (!cutOff) {
      return `${label} cut off time crossed`;
    }

    return `${label} cut off time crossed (${cutOff})`;
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
}