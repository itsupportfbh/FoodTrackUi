import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { forkJoin } from 'rxjs';

import { RequestOverrideService } from './request-override.service';
import { CateringService } from '../services/catering.service';

interface RequestOverrideLine {
  requestOverrideDetailId: number;
  requestDetailId: number;

  sessionId: number;
  sessionName?: string;

  cuisineId: number;
  cuisineName?: string;

  locationId: number;
  locationName?: string;

  baseQty: number;
  overrideQty: number | null;

  isCancelled: boolean;
  planType?: string;
  availableUsers?: number;
}

interface PlanGroup {
  planType: string;
  isSelected: boolean;
  lines: RequestOverrideLine[];
  availableUsers: number;
}

interface OptionItem {
  id: number;
  name: string;
}

@Component({
  selector: 'app-request-override',
  templateUrl: './request-override.component.html',
  styleUrls: ['./request-override.component.scss']
})
export class RequestOverrideComponent implements OnInit, AfterViewInit, AfterViewChecked {
  requestHeaderId = 0;
  fromDate = '';
  toDate = '';

  createdBy = 0;
  userId = 0;
  companyId = 0;

  loading = false;
  saving = false;

  orderDays = 0;

  breakfastCutOffTime = '';
  lunchCutOffTime = '';
  lateLunchCutOffTime = '';
  dinnerCutOffTime = '';
  lateDinnerCutOffTime = '';

  availableUsers = 0;

  model: any = {
    header: {
      requestHeaderId: 0,
      requestNo: '',
      companyId: 0,
      requestFromDate: '',
      requestToDate: '',
      overrideFromDate: '',
      overrideToDate: '',
      notes: '',
      planType: '',
      availableUsers: 0
    },
    lines: [] as RequestOverrideLine[],
    totalQty: 0
  };

  originalLines: RequestOverrideLine[] = [];

  planGroups: PlanGroup[] = [];
  activePlan: PlanGroup | null = null;

  sessionOptions: OptionItem[] = [];
  cuisineOptions: OptionItem[] = [];
  locationOptions: OptionItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RequestOverrideService,
    private toastr: ToastrService,
    private companyService: CateringService
  ) {}

  ngOnInit(): void {
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.createdBy = Number(currentUser.id || currentUser.Id || 0);
      this.userId = Number(currentUser.id || currentUser.Id || 0);
      this.companyId = Number(currentUser.companyId || currentUser.CompanyId || 0);
    }

    this.requestHeaderId = Number(this.route.snapshot.queryParamMap.get('requestHeaderId') || 0);
    this.fromDate = this.route.snapshot.queryParamMap.get('fromDate') || '';
    this.toDate = this.route.snapshot.queryParamMap.get('toDate') || '';

    if (!this.requestHeaderId || !this.fromDate || !this.toDate) {
      this.toastr.error('RequestHeaderId, FromDate and ToDate are required');
      return;
    }

    const fromDateObj = this.parseDateOnly(this.fromDate);
    const toDateObj = this.parseDateOnly(this.toDate);

    if (!fromDateObj || !toDateObj) {
      this.toastr.error('Invalid override date');
      return;
    }

    if (fromDateObj.getTime() > toDateObj.getTime()) {
      this.toastr.error('From date cannot be greater than to date');
      return;
    }

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;

    forkJoin({
      locations: this.companyService.getLocation(),
      sessions: this.companyService.getSession(),
      cuisines: this.companyService.getAllCuisine(),
      pageMasters: this.companyService.getPageMasters(this.userId)
    }).subscribe({
      next: (res: any) => {
        this.locationOptions = this.mapLocationOptions(res.locations);
        this.sessionOptions = this.mapSessionOptions(res.sessions);
        this.cuisineOptions = this.mapCuisineOptions(res.cuisines);

        const pageMasterData = res?.pageMasters?.data || res?.pageMasters || {};

        this.orderDays = Number(pageMasterData.orderDays || pageMasterData.OrderDays || 0);
        this.breakfastCutOffTime = pageMasterData.breakfastCutOffTime || pageMasterData.BreakfastCutOffTime || '';
        this.lunchCutOffTime = pageMasterData.lunchCutOffTime || pageMasterData.LunchCutOffTime || '';
        this.lateLunchCutOffTime = pageMasterData.lateLunchCutOffTime || pageMasterData.LateLunchCutOffTime || '';
        this.dinnerCutOffTime = pageMasterData.dinnerCutOffTime || pageMasterData.DinnerCutOffTime || '';
        this.lateDinnerCutOffTime = pageMasterData.lateDinnerCutOffTime || pageMasterData.LateDinnerCutOffTime || '';

        if (!this.canOverrideEdit(this.fromDate)) {
          this.loading = false;

          Swal.fire({
            icon: 'warning',
            title: 'Not Allowed',
            text: `Override/edit must be done at least ${this.orderDays} days before the override from date`,
            confirmButtonColor: '#7367f0'
          }).then(() => this.cancel());

          return;
        }

        this.loadScreen();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load dropdown values');
      }
    });
  }

  loadScreen(): void {
    this.service.getScreen(this.requestHeaderId, this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (!res?.isSuccess) {
          this.toastr.error(res?.message || 'Failed to load override screen');
          return;
        }

        this.model = res.data || this.model;
        this.model.header = this.model.header || {};
        this.model.header.notes = this.model.header.notes || '';
        this.model.header.planType = this.model.header.planType || '';
        this.availableUsers = Number(this.model.header.availableUsers || 0);

        const requestFrom = this.parseDateOnly(this.model.header.requestFromDate);
        const requestTo = this.parseDateOnly(this.model.header.requestToDate);
        const selectedFrom = this.parseDateOnly(this.fromDate);
        const selectedTo = this.parseDateOnly(this.toDate);

        if (requestFrom && requestTo && selectedFrom && selectedTo) {
          if (selectedFrom.getTime() < requestFrom.getTime() || selectedTo.getTime() > requestTo.getTime()) {
            Swal.fire({
              icon: 'warning',
              title: 'Invalid Range',
              text: 'Override range must be within request date range',
              confirmButtonColor: '#7367f0'
            }).then(() => this.cancel());

            return;
          }
        }

        const incomingLines: RequestOverrideLine[] = Array.isArray(this.model.lines) ? this.model.lines : [];

        this.model.lines = incomingLines.map((line: RequestOverrideLine) => {
          const baseQty = Number(line.baseQty || 0);

          return {
            ...line,
            sessionName: line.sessionName || this.getSessionName(line.sessionId),
            cuisineName: line.cuisineName || this.getCuisineName(line.cuisineId),
            locationName: line.locationName || this.getLocationName(line.locationId),
            isCancelled: !!line.isCancelled,
            baseQty,
            overrideQty:
              line.overrideQty === null || line.overrideQty === undefined
                ? null
                : Number(line.overrideQty)
          };
        });

        this.originalLines = JSON.parse(JSON.stringify(this.model.lines));

        this.buildPlanGroups();
        this.onLineChange();
        this.refreshFeather();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error while loading override screen');
      }
    });
  }

buildPlanGroups(): void {
  const lines: RequestOverrideLine[] = this.model.lines || [];

  const usedPlans: string[] = Array.from(
    new Set<string>(
      lines
        .map((x: RequestOverrideLine) => String(x.planType || '').trim())
        .filter((x: string) => x.length > 0)
    )
  );

  this.planGroups = usedPlans.map((plan: string): PlanGroup => {
    const planLines = lines.filter(
      (x: RequestOverrideLine) =>
        String(x.planType || '').trim().toLowerCase() === plan.toLowerCase()
    );

    return {
      planType: plan,
      isSelected: true,
      lines: planLines,
      availableUsers: Number(planLines[0]?.availableUsers || 0)
    };
  });

  this.activePlan = this.planGroups.length > 0 ? this.planGroups[0] : null;

  this.availableUsers = this.getTotalAvailableUsers();
  this.onLineChange();
}
selectPlan(plan: PlanGroup): void {
  this.activePlan = plan;
  this.planGroups.forEach(x => x.isSelected = true);
  this.availableUsers = this.getTotalAvailableUsers();
  this.onLineChange();
}

getTotalAvailableUsers(): number {
  return (this.planGroups || [])
    .filter(x => x.isSelected)
    .reduce((sum, x) => sum + Number(x.availableUsers || 0), 0);
}

getPlanQty(plan: PlanGroup): number {
  return (plan.lines || [])
    .filter(x => !x.isCancelled)
    .reduce((sum, x) => sum + Number(x.overrideQty || 0), 0);
}

getTotalOverrideQty(): number {
  return (this.planGroups || [])
    .filter(x => x.isSelected)
    .reduce((sum, plan) => sum + this.getPlanQty(plan), 0);
}

isPlanQtyMatched(plan: PlanGroup): boolean {
  return this.getPlanQty(plan) === Number(plan.availableUsers || 0);
}

isQtyMatched(): boolean {
  return (this.planGroups || [])
    .filter(x => x.isSelected)
    .every(plan => this.isPlanQtyMatched(plan));
}

getMismatchPlans(): PlanGroup[] {
  return (this.planGroups || [])
    .filter(x => x.isSelected && !this.isPlanQtyMatched(x));
}
updateAvailableUsers(): void {
  if (!this.activePlan || !this.activePlan.lines.length) {
    this.availableUsers = 0;
    return;
  }

  this.availableUsers = Number(this.activePlan.lines[0].availableUsers || 0);
}

getActivePlanQty(): number {
  if (!this.activePlan) return 0;

  return (this.activePlan.lines || [])
    .filter(x => !x.isCancelled)
    .reduce((sum, x) => sum + Number(x.overrideQty || 0), 0);
}


  onOverrideQtyChange(line: RequestOverrideLine, value: any): void {
    if (value === '' || value === null || value === undefined) {
      line.overrideQty = null;
    } else {
      line.overrideQty = Number(value);

      if (line.overrideQty < 0) {
        line.overrideQty = 0;
      }
    }

    if (line.isCancelled && Number(line.overrideQty) > 0) {
      line.isCancelled = false;
    }

    this.onLineChange();
  }

  onLineChange(): void {
    this.model.totalQty = this.getTotalOverrideQty();
  }



  getQtyDifference(): number {
    return this.getTotalOverrideQty() - Number(this.availableUsers || 0);
  }



  resetOverride(): void {
    this.model.lines = JSON.parse(JSON.stringify(this.originalLines));

    this.model.lines = this.model.lines.map((line: RequestOverrideLine) => ({
      ...line,
      sessionName: line.sessionName || this.getSessionName(line.sessionId),
      cuisineName: line.cuisineName || this.getCuisineName(line.cuisineId),
      locationName: line.locationName || this.getLocationName(line.locationId)
    }));

    this.buildPlanGroups();
    this.onLineChange();
    this.refreshFeather();
  }

save(): void {
  if (this.saving) return;

  if (!this.planGroups || this.planGroups.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Plan Required',
      text: 'Plan details not found.',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  if (!this.canOverrideEdit(this.fromDate)) {
    Swal.fire({
      icon: 'warning',
      title: 'Not Allowed',
      text: `Override/edit must be done at least ${this.orderDays} days before the override from date`,
      confirmButtonColor: '#7367f0'
    });
    return;
  }

  const selectedPlans = this.planGroups.filter(x => x.isSelected);

  const mismatchPlans = selectedPlans.filter(plan =>
    this.getPlanQty(plan) !== Number(plan.availableUsers || 0)
  );

  if (mismatchPlans.length > 0) {
    const msg = mismatchPlans
      .map(plan =>
        `${plan.planType} plan has ${plan.availableUsers} active user(s). You entered ${this.getPlanQty(plan)}.`
      )
      .join(' ');

    Swal.fire({
      icon: 'warning',
      title: 'Quantity Mismatch',
      text: msg,
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  const selectedLines: RequestOverrideLine[] = [];

  selectedPlans.forEach((plan: PlanGroup) => {
    (plan.lines || []).forEach((line: RequestOverrideLine) => {
      selectedLines.push(line);
    });
  });

  const changedLines = selectedLines.map((x: RequestOverrideLine) => ({
    requestDetailId: x.requestDetailId,
    sessionId: Number(x.sessionId || 0),
    cuisineId: Number(x.cuisineId || 0),
    locationId: Number(x.locationId || 0),
    baseQty: Number(x.baseQty || 0),
    overrideQty: Number(x.overrideQty || 0),
    isCancelled: false,
    planType: String(x.planType || '').trim()
  }));

  if (changedLines.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Data',
      text: 'No override lines found.',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  const payload = {
    requestHeaderId: this.requestHeaderId,
    fromDate: this.fromDate,
    toDate: this.toDate,
    notes: this.model.header.notes || '',
    createdBy: this.createdBy,
    lines: changedLines
  };

  this.saving = true;

  this.service.save(payload).subscribe({
    next: (res: any) => {
      this.saving = false;

      if (res?.isSuccess) {
        Swal.fire({
          icon: 'success',
          title: 'Saved Successfully',
          text: res?.message || 'Override saved successfully.',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.router.navigate(['/requestoverride/Request-override-list'], {
            queryParams: {
              requestHeaderId: this.requestHeaderId,
              requestNo: this.model.header.requestNo
            }
          });
        });
        return;
      }

      Swal.fire({
        icon: res?.messageType === 'warning' ? 'warning' : 'error',
        title: res?.messageType === 'warning' ? 'Validation Warning' : 'Save Failed',
        text: res?.message || 'Something went wrong.',
        confirmButtonColor: res?.messageType === 'warning' ? '#f59e0b' : '#ea5455'
      });
    },
    error: (err) => {
      this.saving = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error?.message || 'Error while saving override.',
        confirmButtonColor: '#ea5455'
      });
    }
  });
}

  cancel(): void {
    this.router.navigate(['/requestoverride/Request-override-list'], {
      queryParams: {
        requestHeaderId: this.requestHeaderId,
        requestNo: this.model.header.requestNo
      }
    });
  }

  private mapSessionOptions(res: any): OptionItem[] {
    const data = res?.data || res || [];

    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x.id ?? x.Id ?? x.sessionId ?? x.SessionId ?? 0),
      name: x.name ?? x.Name ?? x.sessionName ?? x.SessionName ?? ''
    }));
  }

  private mapCuisineOptions(res: any): OptionItem[] {
    const data = res?.data || res || [];

    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x.id ?? x.Id ?? x.cuisineId ?? x.CuisineId ?? 0),
      name: x.name ?? x.Name ?? x.cuisineName ?? x.CuisineName ?? ''
    }));
  }

  private mapLocationOptions(res: any): OptionItem[] {
    const data = res?.data || res || [];

    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x.id ?? x.Id ?? x.locationId ?? x.LocationId ?? 0),
      name: x.name ?? x.Name ?? x.locationName ?? x.LocationName ?? ''
    }));
  }

  getSessionName(id: number): string {
    return this.sessionOptions.find(x => Number(x.id) === Number(id))?.name || `Session ${id}`;
  }

  getCuisineName(id: number): string {
    return this.cuisineOptions.find(x => Number(x.id) === Number(id))?.name || `Cuisine ${id}`;
  }

  getLocationName(id: number): string {
    return this.locationOptions.find(x => Number(x.id) === Number(id))?.name || `Location ${id}`;
  }

  private canOverrideEdit(fromDateValue: any): boolean {
    const fromDate = this.parseDateOnly(fromDateValue);
    if (!fromDate) return false;

    const now = new Date();
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const lastAllowedEditDate = new Date(fromDate);
    lastAllowedEditDate.setDate(lastAllowedEditDate.getDate() - this.orderDays);

    return todayOnly.getTime() <= lastAllowedEditDate.getTime();
  }

  private parseDateOnly(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value !== 'string') return null;

    const v = value.trim();

    if (v.includes('T')) {
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [year, month, day] = v.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
      const [day, month, year] = v.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [day, month, year] = v.split('/').map(Number);
      return new Date(year, month - 1, day);
    }

    const d = new Date(v);
    if (isNaN(d.getTime())) return null;

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private refreshFeather(): void {
    setTimeout(() => feather.replace());
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }
}