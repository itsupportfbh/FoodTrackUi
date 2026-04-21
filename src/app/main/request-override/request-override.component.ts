import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RequestOverrideService } from './request-override.service';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { CateringService } from '../services/catering.service';
import { forkJoin } from 'rxjs';

interface RequestOverrideLine {
  requestOverrideDetailId: number;
  requestDetailId: number;
  sessionId: number;
  cuisineId: number;
  locationId: number;
  baseQty: number;
  overrideQty: number | null;
  isCancelled: boolean;
  sessionName?: string;
  cuisineName?: string;
  locationName?: string;
}

interface SessionGroup {
  sessionId: number;
  sessionName: string;
  isOpen: boolean;
  lines: RequestOverrideLine[];
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
  userId!: number;
  companyId!: number;

  loading = false;
  saving = false;

  breakfastCutOffTime = '';
  lunchCutOffTime = '';
  lateLunchCutOffTime = '';
  dinnerCutOffTime = '';
  lateDinnerCutOffTime = '';
  orderDays = 0;

  model: any = {
    header: {
      requestHeaderId: 0,
      requestNo: '',
      companyId: 0,
      requestFromDate: '',
      requestToDate: '',
      overrideFromDate: '',
      overrideToDate: '',
      notes: ''
    },
    lines: [] as RequestOverrideLine[],
    totalQty: 0
  };

  originalLines: RequestOverrideLine[] = [];
  sessionGroups: SessionGroup[] = [];

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
      this.createdBy = Number(currentUser.id || 0);
      this.userId = Number(currentUser.id || 0);
      this.companyId = Number(currentUser.companyId || 0);
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
          }).then(() => {
            this.cancel();
          });
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
            }).then(() => {
              this.cancel();
            });
            return;
          }
        }

        const incomingLines: RequestOverrideLine[] = Array.isArray(this.model.lines) ? this.model.lines : [];

        this.model.lines = incomingLines.map((line: RequestOverrideLine) => {
          const baseQty = Number(line.baseQty || 0);

          return {
            ...line,
            sessionName: this.getSessionName(line.sessionId),
            cuisineName: this.getCuisineName(line.cuisineId),
            locationName: this.getLocationName(line.locationId),
            isCancelled: !!line.isCancelled,
            baseQty,
            overrideQty:
              line.overrideQty === null || line.overrideQty === undefined
                ? null
                : Number(line.overrideQty)
          };
        });

        this.originalLines = JSON.parse(JSON.stringify(this.model.lines));
        this.buildSessionGroups();
        this.onLineChange();
        this.refreshFeather();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error while loading override screen');
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

  buildSessionGroups(): void {
    const grouped: { [key: number]: SessionGroup } = {};

    (this.model.lines || []).forEach((line: RequestOverrideLine) => {
      if (!grouped[line.sessionId]) {
        grouped[line.sessionId] = {
          sessionId: line.sessionId,
          sessionName: this.getSessionName(line.sessionId),
          isOpen: true,
          lines: []
        };
      }

      grouped[line.sessionId].lines.push(line);
    });

    this.sessionGroups = Object.values(grouped);
  }

  toggleAccordion(group: SessionGroup): void {
    group.isOpen = !group.isOpen;
    this.refreshFeather();
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

  onCancelledChange(line: RequestOverrideLine): void {
    line.isCancelled = !!line.isCancelled;
    this.onLineChange();
  }

  onOverrideQtyChange(line: RequestOverrideLine, value: any): void {
    if (value === '' || value === null || value === undefined) {
      line.overrideQty = null as any;
    } else {
      line.overrideQty = Number(value);

      if (line.overrideQty < 0) {
        line.overrideQty = null as any;
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

  getTotalOverrideQty(): number {
    return (this.model.lines || [])
      .filter((x: RequestOverrideLine) => !x.isCancelled)
      .reduce((sum: number, x: RequestOverrideLine) => sum + Number(x.overrideQty || 0), 0);
  }

  resetOverride(): void {
    this.model.lines = JSON.parse(JSON.stringify(this.originalLines));

    this.model.lines = this.model.lines.map((line: RequestOverrideLine) => ({
      ...line,
      sessionName: this.getSessionName(line.sessionId),
      cuisineName: this.getCuisineName(line.cuisineId),
      locationName: this.getLocationName(line.locationId)
    }));

    this.buildSessionGroups();
    this.onLineChange();
    this.refreshFeather();
  }

  private getSessionCutOffTime(sessionId: number, sessionName?: string): string {
    const id = Number(sessionId || 0);
    const name = (sessionName || '').toLowerCase().trim();

    if (name === 'breakfast') {
      return this.breakfastCutOffTime;
    }

    if (name === 'lunch') {
      return this.lunchCutOffTime;
    }

    if (name === 'late lunch' || name === 'latelunch') {
      return this.lateLunchCutOffTime;
    }

    if (name === 'dinner') {
      return this.dinnerCutOffTime;
    }

    if (name === 'late dinner' || name === 'latedinner') {
      return this.lateDinnerCutOffTime;
    }

    if (id === 1) {
      return this.lunchCutOffTime;
    }

    if (id === 2) {
      return this.dinnerCutOffTime;
    }

    return '';
  }

  private parseTimeToMinutes(timeValue: string): number | null {
    if (!timeValue) {
      return null;
    }

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

      if (meridian === 'PM' && hour < 12) {
        hour += 12;
      }

      if (meridian === 'AM' && hour === 12) {
        hour = 0;
      }

      return hour * 60 + minute;
    }

    return null;
  }

  isSessionCutOffCrossed(sessionId: number, sessionName?: string): boolean {
    const selectedDate = this.parseDateOnly(this.fromDate);
    if (!selectedDate) {
      return false;
    }

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (selectedDate.getTime() !== todayOnly.getTime()) {
      return false;
    }

    const cutOff = this.getSessionCutOffTime(sessionId, sessionName);
    if (!cutOff) {
      return false;
    }

    const cutOffMinutes = this.parseTimeToMinutes(cutOff);
    if (cutOffMinutes === null) {
      return false;
    }

    const currentMinutes = today.getHours() * 60 + today.getMinutes();

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

  save(): void {
    if (this.saving) {
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

    const blockedSessions: string[] = [];

    for (const group of this.sessionGroups) {
      const hasQtyChange = (group.lines || []).some((x: RequestOverrideLine) =>
        x.isCancelled === true || Number(x.overrideQty || 0) !== Number(x.baseQty || 0)
      );

      if (hasQtyChange && this.isSessionCutOffCrossed(group.sessionId, group.sessionName)) {
        blockedSessions.push(group.sessionName || `Session ${group.sessionId}`);
      }
    }

    if (blockedSessions.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cut Off Time Crossed',
        text: `${blockedSessions.join(', ')} cut off time crossed. Override not allowed for these sessions.`,
        confirmButtonColor: '#7367f0'
      });
      return;
    }

    const changedLines = (this.model.lines || [])
      .filter((x: RequestOverrideLine) =>
        x.isCancelled === true || Number(x.overrideQty || 0) !== Number(x.baseQty || 0)
      )
      .map((x: RequestOverrideLine) => ({
        requestDetailId: x.requestDetailId,
        sessionId: x.sessionId,
        cuisineId: x.cuisineId,
        locationId: x.locationId,
        baseQty: Number(x.baseQty || 0),
        overrideQty: x.isCancelled ? 0 : Number(x.overrideQty || 0),
        isCancelled: !!x.isCancelled
      }));

    if (changedLines.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Changes',
        text: 'No override changes found',
        confirmButtonColor: '#7367f0'
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
            text: res?.message || 'Override saved successfully',
            showConfirmButton: false,
            timer: 1500,
            confirmButtonColor: '#7367f0'
          }).then(() => {
            this.router.navigate(['/requestoverride/Request-override-list'], {
              queryParams: {
                requestHeaderId: this.requestHeaderId,
                requestNo: this.model.header.requestNo
              }
            });
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: res?.message || 'Something went wrong',
            confirmButtonColor: '#ea5455'
          });
        }
      },
      error: (err) => {
        this.saving = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Error while saving override',
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

  private refreshFeather(): void {
    setTimeout(() => {
      feather.replace();
    });
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
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
}