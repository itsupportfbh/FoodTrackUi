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
  planType: string;
  cuisineId: number;
  baseQty: number;
  overrideQty: number | null;
  isCancelled: boolean;
  cuisineName?: string;
}

interface PlanGroup {
  planType: string;
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
  userId = 0;
  companyId = 0;

  loading = false;
  saving = false;
  orderDays = 0;

  plans: string[] = ['Basic', 'Standard', 'Premium'];
  selectedPlans: string[] = [];

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
  planGroups: PlanGroup[] = [];
  cuisineOptions: OptionItem[] = [];

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
      cuisines: this.companyService.getAllCuisine(),
      pageMasters: this.companyService.getPageMasters(this.userId)
    }).subscribe({
      next: (res: any) => {
        this.cuisineOptions = this.mapCuisineOptions(res.cuisines);

        const pageMasterData = res?.pageMasters?.data || res?.pageMasters || {};
        this.orderDays = Number(pageMasterData.orderDays || pageMasterData.OrderDays || 0);

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
          if (
            selectedFrom.getTime() < requestFrom.getTime() ||
            selectedTo.getTime() > requestTo.getTime()
          ) {
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

        const incomingLines: any[] = Array.isArray(this.model.lines)
          ? this.model.lines
          : [];

        this.model.lines = incomingLines.map((line: any) => {
          const planType =
            line.planType ||
            line.PlanType ||
            this.model.header.planType ||
            this.model.header.PlanType ||
            '';

          const cuisineId = Number(line.cuisineId || line.CuisineId || 0);

          const baseQty = Number(
            line.baseQty ||
            line.BaseQty ||
            line.qty ||
            line.Qty ||
            0
          );

          return {
            requestOverrideDetailId: Number(
              line.requestOverrideDetailId ||
              line.RequestOverrideDetailId ||
              0
            ),
            requestDetailId: Number(
              line.requestDetailId ||
              line.RequestDetailId ||
              0
            ),
            planType: planType,
            cuisineId: cuisineId,
            cuisineName:
              line.cuisineName ||
              line.CuisineName ||
              this.getCuisineName(cuisineId),
            baseQty: baseQty,
            overrideQty:
              line.overrideQty === null || line.overrideQty === undefined
                ? null
                : Number(line.overrideQty),
            isCancelled: !!line.isCancelled
          };
        });

        this.selectedPlans = this.getSelectedPlansFromLines(this.model.lines);

        this.originalLines = JSON.parse(JSON.stringify(this.model.lines));

        this.buildPlanGroups();
        this.syncLinesFromGroups();
        this.onLineChange();
        this.refreshFeather();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error while loading override screen');
      }
    });
  }

  private mapCuisineOptions(res: any): OptionItem[] {
    const data = res?.data || res || [];

    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x.id ?? x.Id ?? x.cuisineId ?? x.CuisineId ?? 0),
      name: x.name ?? x.Name ?? x.cuisineName ?? x.CuisineName ?? ''
    }));
  }

  private getSelectedPlansFromLines(lines: RequestOverrideLine[]): string[] {
    const selected: string[] = [];

    (lines || []).forEach((line: RequestOverrideLine) => {
      const plan = this.normalizePlan(line.planType);

      if (plan && selected.indexOf(plan) === -1) {
        selected.push(plan);
      }
    });

    return selected;
  }

  private normalizePlan(value: any): string {
    const text = String(value || '').trim().toLowerCase();

    if (text === 'basic') {
      return 'Basic';
    }

    if (text === 'standard') {
      return 'Standard';
    }

    if (text === 'premium') {
      return 'Premium';
    }

    return '';
  }

  buildPlanGroups(): void {
    const existingLines: RequestOverrideLine[] = this.model.lines || [];

    this.planGroups = this.plans.map((plan: string, index: number) => {
      const planLines: RequestOverrideLine[] = this.cuisineOptions.map((cuisine: OptionItem) => {
        const match = existingLines.find((x: RequestOverrideLine) => {
          return (
            this.normalizePlan(x.planType) === plan &&
            Number(x.cuisineId) === Number(cuisine.id)
          );
        });

        return {
          requestOverrideDetailId: match?.requestOverrideDetailId || 0,
          requestDetailId: match?.requestDetailId || 0,
          planType: plan,
          cuisineId: Number(cuisine.id),
          cuisineName: cuisine.name,
          baseQty: Number(match?.baseQty || 0),
          overrideQty:
            match?.overrideQty === null || match?.overrideQty === undefined
              ? null
              : Number(match.overrideQty),
          isCancelled: !!match?.isCancelled
        };
      });

     return {
  planType: plan,
  isOpen: this.selectedPlans.includes(plan),
  lines: planLines
};
    });
  }

getVisiblePlanGroups(): PlanGroup[] {
  return this.planGroups.filter(group =>
    this.selectedPlans.includes(group.planType)
  );
}
  syncLinesFromGroups(): void {
    this.model.lines = this.planGroups
      .filter((group: PlanGroup) => this.selectedPlans.includes(group.planType))
      .reduce((acc: RequestOverrideLine[], group: PlanGroup) => {
        return acc.concat(group.lines || []);
      }, []);
  }

  toggleAccordion(group: PlanGroup): void {
    group.isOpen = !group.isOpen;
    this.refreshFeather();
  }

  getCuisineName(id: number): string {
    return this.cuisineOptions.find(x => Number(x.id) === Number(id))?.name || `Cuisine ${id}`;
  }

  onOverrideQtyChange(line: RequestOverrideLine, value: any): void {
    if (value === '' || value === null || value === undefined) {
      line.overrideQty = null;
    } else {
      const qty = Number(value);
      line.overrideQty = qty < 0 ? null : qty;
    }

    if (line.isCancelled && Number(line.overrideQty) > 0) {
      line.isCancelled = false;
    }

    this.syncLinesFromGroups();
    this.onLineChange();
  }

  onLineChange(): void {
    this.model.totalQty = this.getTotalOverrideQty();
  }

  getTotalOverrideQty(): number {
    return (this.model.lines || [])
      .filter((x: RequestOverrideLine) => !x.isCancelled)
      .reduce((sum: number, x: RequestOverrideLine) => {
        return sum + Number(x.overrideQty || 0);
      }, 0);
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

    if (!this.selectedPlans.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing',
        text: 'Please select at least one plan',
        confirmButtonColor: '#7367f0'
      });
      return;
    }

    this.syncLinesFromGroups();

    const changedLines = (this.model.lines || [])
      .filter((x: RequestOverrideLine) => {
        return (
          x.isCancelled === true ||
          Number(x.overrideQty || 0) !== Number(x.baseQty || 0)
        );
      })
      .map((x: RequestOverrideLine) => ({
        requestOverrideDetailId: x.requestOverrideDetailId || 0,
        requestDetailId: x.requestDetailId || 0,
        planType: x.planType,
        cuisineId: x.cuisineId,
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
onPlanToggle(plan: string, event: any): void {
  const checked = !!event.target.checked;

  if (checked) {
    if (!this.selectedPlans.includes(plan)) {
      this.selectedPlans.push(plan);
    }

    this.planGroups.forEach((group: PlanGroup) => {
      group.isOpen = group.planType === plan;
    });
  } else {
    this.selectedPlans = this.selectedPlans.filter(x => x !== plan);

    const group = this.planGroups.find(x => x.planType === plan);
    if (group) {
      group.isOpen = false;
      group.lines.forEach((line: RequestOverrideLine) => {
        line.overrideQty = null;
        line.isCancelled = false;
      });
    }
  }

  this.syncLinesFromGroups();
  this.onLineChange();
  this.refreshFeather();
}
  private canOverrideEdit(fromDateValue: any): boolean {
    const fromDate = this.parseDateOnly(fromDateValue);

    if (!fromDate) {
      return false;
    }

    const now = new Date();
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const lastAllowedEditDate = new Date(fromDate);
    lastAllowedEditDate.setDate(lastAllowedEditDate.getDate() - this.orderDays);

    return todayOnly.getTime() <= lastAllowedEditDate.getTime();
  }

  private parseDateOnly(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value !== 'string') {
      return null;
    }

    const v = value.trim();

    if (v.includes('T')) {
      const d = new Date(v);

      if (isNaN(d.getTime())) {
        return null;
      }

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

    if (isNaN(d.getTime())) {
      return null;
    }

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
}
