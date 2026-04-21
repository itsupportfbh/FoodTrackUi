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

    this.cuisinePriceService.getAllSessions().subscribe({
      next: (res: any) => {
        this.assignedSessions = (res?.data || res || []).map((x: any) => ({
          sessionId: Number(x.id ?? x.Id),
          sessionName: x.sessionName || x.SessionName
        }));

        this.buildPlanRows();
        this.sessionLoading = false;

        if (this.planRows.length > 0) {
          this.loadExistingPlanRates();
        }
      },
      error: () => {
        this.sessionLoading = false;
        this.assignedSessions = [];
        this.planRows = [];
      }
    });
  }

  buildPlanRows(): void {
    const planTypes = ['Premium', 'Standard','Basic'];

    this.planRows = planTypes.map(plan => ({
      planType: plan,
      effectiveFrom: this.todayDate(),
      sessionRates: this.assignedSessions.map(session => ({
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
          const existingPlan = data.find((x: any) => x.planType === planRow.planType);

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
      `Please enter valid rates for all sessions in ${invalidRow.planType}`,
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
      sessionRates: row.sessionRates.map(x => ({
        sessionId: x.sessionId,
        rate: Number(x.rate)
      }))
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
}