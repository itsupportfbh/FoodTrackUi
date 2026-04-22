import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import Swal from 'sweetalert2';
import { CuisinePriceService } from './cuisine-price.service';
import { Router } from '@angular/router';

interface AssignedSession {
  sessionId: number;
  sessionName: string;
}

interface PlanRateItem {
  sessionId: number;
  sessionName: string;
  rate: number;
}

interface PlanRateRow {
  planType: string;
  effectiveFrom: string;
  sessionRates: PlanRateItem[];
}

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrls: ['./price-master.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceMasterComponent implements OnInit {
  sessionLoading = false;
  saving = false;

  assignedSessions: AssignedSession[] = [];
  displaySessions: AssignedSession[] = [];
  planRows: PlanRateRow[] = [];

  constructor(
    private cuisinePriceService: CuisinePriceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.sessionLoading = true;
    this.planRows = [];
    this.assignedSessions = [];
    this.displaySessions = [];

    this.cuisinePriceService.getAllSessions().subscribe({
      next: (res: any) => {
        this.assignedSessions = (res?.data || res || []).map((x: any) => ({
          sessionId: Number(x.id ?? x.Id),
          sessionName: x.sessionName || x.SessionName
        }));

        this.displaySessions = this.assignedSessions.filter(
          s => !this.isLateLunch(s.sessionName) && !this.isLateDinner(s.sessionName)
        );

        this.buildPlanRows();
        this.sessionLoading = false;

        if (this.planRows.length > 0) {
          this.loadExistingPlanRates();
        }
      },
      error: () => {
        this.sessionLoading = false;
        this.assignedSessions = [];
        this.displaySessions = [];
        this.planRows = [];
      }
    });
  }

  buildPlanRows(): void {
    const planTypes = ['Premium', 'Standard', 'Basic'];

    this.planRows = planTypes.map(plan => ({
      planType: plan,
      effectiveFrom: this.todayDate(),
      sessionRates: this.displaySessions.map(session => ({
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        rate: 0
      }))
    }));
  }

  loadExistingPlanRates(): void {
    this.cuisinePriceService.getDefaultPlanRates().subscribe({
      next: (res: any) => {
        const data = res?.data || [];

        this.planRows.forEach(planRow => {
          const existingPlan = data.find(
            (x: any) => this.normalizePlanType(x.planType) === this.normalizePlanType(planRow.planType)
          );

          if (!existingPlan) {
            return;
          }

          if (existingPlan.effectiveFrom) {
            planRow.effectiveFrom = this.toInputDate(existingPlan.effectiveFrom);
          }

          planRow.sessionRates.forEach(session => {
            const matched = (existingPlan.sessionRates || []).find(
              (x: any) => Number(x.sessionId) === session.sessionId
            );

            if (matched) {
              session.rate = Number(matched.rate || 0);
              return;
            }

            // fallback:
            // if UI session is Lunch, but only Late Lunch rate exists in backend, use that
            if (this.isLunch(session.sessionName)) {
              const lateLunchRate = (existingPlan.sessionRates || []).find((x: any) =>
                this.isLateLunch(x.sessionName || x.SessionName || '')
              );
              if (lateLunchRate) {
                session.rate = Number(lateLunchRate.rate || 0);
                return;
              }
            }

            // if UI session is Dinner, but only Late Dinner rate exists in backend, use that
            if (this.isDinner(session.sessionName)) {
              const lateDinnerRate = (existingPlan.sessionRates || []).find((x: any) =>
                this.isLateDinner(x.sessionName || x.SessionName || '')
              );
              if (lateDinnerRate) {
                session.rate = Number(lateDinnerRate.rate || 0);
              }
            }
          });
        });
      },
      error: () => {
        // keep default
      }
    });
  }

  getPerDay(row: PlanRateRow): number {
    return row.sessionRates.reduce((sum, item) => sum + Number(item.rate || 0), 0);
  }

  getMonthly(row: PlanRateRow): number {
    return this.getPerDay(row) * 30;
  }

  saveRates(): void {
    if (!this.planRows.length) {
      Swal.fire('Validation', 'No sessions available', 'warning');
      return;
    }

    const invalidRow = this.planRows.find(row =>
      !row.effectiveFrom || row.sessionRates.some(x => Number(x.rate) <= 0)
    );

    if (invalidRow) {
      Swal.fire(
        'Validation',
        `Please enter valid rates for all visible sessions in ${invalidRow.planType}`,
        'warning'
      );
      return;
    }

    this.saving = true;
    const updatedBy = Number(localStorage.getItem('userId') || 1);

    const payload = {
      updatedBy,
      plans: this.planRows.map(row => ({
        planType: row.planType,
        effectiveFrom: row.effectiveFrom,
        sessionRates: this.buildSessionRatesForSave(row)
      }))
    };

    this.cuisinePriceService.saveDefaultPlanRatesBulk(payload).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Default plan rates saved successfully',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.router.navigate(['/master/priceLists']);
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save plan rates', 'error');
      }
    });
  }

  buildSessionRatesForSave(row: PlanRateRow): { sessionId: number; rate: number }[] {
    const rateMap = new Map<number, number>();

    row.sessionRates.forEach(x => {
      rateMap.set(x.sessionId, Number(x.rate || 0));
    });

    const lunchRate = this.getRateBySessionName(row, 'lunch');
    const dinnerRate = this.getRateBySessionName(row, 'dinner');

    this.assignedSessions.forEach(session => {
      if (this.isLateLunch(session.sessionName)) {
        rateMap.set(session.sessionId, lunchRate);
      } else if (this.isLateDinner(session.sessionName)) {
        rateMap.set(session.sessionId, dinnerRate);
      } else {
        const existing = row.sessionRates.find(x => x.sessionId === session.sessionId);
        rateMap.set(session.sessionId, Number(existing?.rate || 0));
      }
    });

    return this.assignedSessions.map(session => ({
      sessionId: session.sessionId,
      rate: Number(rateMap.get(session.sessionId) || 0)
    }));
  }

  getRateBySessionName(row: PlanRateRow, target: 'lunch' | 'dinner'): number {
    const found = row.sessionRates.find(x =>
      target === 'lunch' ? this.isLunch(x.sessionName) : this.isDinner(x.sessionName)
    );
    return Number(found?.rate || 0);
  }

  goBackToList(): void {
    this.router.navigate(['/master/priceLists']);
  }

  formatSessionName(sessionName: string): string {
    return sessionName || '';
  }

  todayDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toInputDate(value: string): string {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[\s_-]/g, '')
      .trim();
  }

  normalizePlanType(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  isLunch(name: string): boolean {
    return this.normalizeText(name) === 'lunch';
  }

  isDinner(name: string): boolean {
    return this.normalizeText(name) === 'dinner';
  }

  isLateLunch(name: string): boolean {
    const val = this.normalizeText(name);
    return val === 'latelunch';
  }

  isLateDinner(name: string): boolean {
    const val = this.normalizeText(name);
    return val === 'latedinner';
  }

  trackBySession(index: number, item: any): number {
    return item.sessionId;
  }

  trackByPlan(index: number, item: PlanRateRow): string {
    return item.planType;
  }
}