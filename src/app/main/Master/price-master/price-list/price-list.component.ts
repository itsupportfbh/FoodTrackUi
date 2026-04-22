import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CuisinePriceService } from '../cuisine-price.service';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { Router } from '@angular/router';

interface PriceListRow {
  id: number;
  priceId: number;
  companyId: number;
  companyName: string;
  sessionId: number;
  sessionName: string;
  planType: string;
  rate: number;
  effectiveFrom: string;
  isCurrent: boolean;
}

interface PlanCard {
  planType: string;
  sessionNames: string;
  perDay: number;
  monthly: number;
  effectiveFromDisplay: string;
}

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceListComponent implements OnInit {
  loading = false;

  summary: any = null;
  planCards: PlanCard[] = [];

  constructor(
    private priceService: CuisinePriceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getPriceList();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  getPriceList(): void {
    this.loading = true;

    this.priceService.getPriceList().subscribe({
      next: (res: any) => {
        const rawRows: PriceListRow[] = (res || [])
          .map((item: any) => ({
            id: Number(item.id || 0),
            priceId: Number(item.priceId || 0),
            companyId: Number(item.companyId || 0),
            companyName: item.companyName || '',
            sessionId: Number(item.sessionId || 0),
            sessionName: item.sessionName || '',
            planType: item.planType || '',
            rate: Number(item.rate || 0),
            effectiveFrom: item.effectiveFrom,
            isCurrent: !!item.isCurrent
          }))
          .filter((item: PriceListRow) => item.isCurrent);

        this.buildView(rawRows);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.summary = null;
        this.planCards = [];

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load price list'
        });
      }
    });
  }

  buildView(data: PriceListRow[]): void {
    if (!data || data.length === 0) {
      this.summary = null;
      this.planCards = [];
      return;
    }

    const normalizedRows = data.map(x => ({
      ...x,
      displaySessionName: this.getDisplaySessionName(x.sessionName)
    }));

    const uniqueSessions = this.getOrderedDisplaySessions(
      [...new Set(normalizedRows.map(x => x.displaySessionName).filter(Boolean))]
    );

    const uniquePlans = this.getOrderedPlans(
      [...new Set(normalizedRows.map(x => x.planType).filter(Boolean))]
    );

    const earliestEffectiveFrom = this.getEarliestDate(
      normalizedRows.map(x => x.effectiveFrom).filter(Boolean)
    );

    this.summary = {
      title: 'Default For All Companies',
      sessionsText: uniqueSessions.join(', '),
      plansText: uniquePlans.join(', '),
      effectiveFromDisplay: earliestEffectiveFrom ? this.formatDate(earliestEffectiveFrom) : '-'
    };

    const orderedPlans = ['Basic', 'Standard', 'Premium'];

    this.planCards = orderedPlans
      .filter(plan => normalizedRows.some(x => this.normalizePlanType(x.planType) === this.normalizePlanType(plan)))
      .map(plan => {
        const planRows = normalizedRows.filter(
          x => this.normalizePlanType(x.planType) === this.normalizePlanType(plan)
        );

        const grouped = new Map<string, PriceListRow & { displaySessionName: string }>();

        planRows.forEach(row => {
          const key = this.normalizeSessionName(row.displaySessionName);
          const existing = grouped.get(key);

          if (!existing) {
            grouped.set(key, row);
            return;
          }

          const existingDate = new Date(existing.effectiveFrom);
          const currentDate = new Date(row.effectiveFrom);

          if (
            isNaN(existingDate.getTime()) ||
            (!isNaN(currentDate.getTime()) && currentDate > existingDate)
          ) {
            grouped.set(key, row);
          }
        });

        const uniqueDisplayRows = Array.from(grouped.values());

        const orderedSessionNames = this.getOrderedDisplaySessions(
          uniqueDisplayRows.map(x => x.displaySessionName)
        );

        const perDay = uniqueDisplayRows.reduce((sum, item) => sum + Number(item.rate || 0), 0);

        const effectiveFrom = this.getEarliestDate(
          uniqueDisplayRows.map(x => x.effectiveFrom).filter(Boolean)
        );

        return {
          planType: plan,
          sessionNames: orderedSessionNames.join(', '),
          perDay,
          monthly: perDay * 30,
          effectiveFromDisplay: effectiveFrom ? this.formatDate(effectiveFrom) : '-'
        };
      });
  }

  onAddPrice(): void {
    this.router.navigate(['/master/price']);
  }

  editPrice(): void {
    this.router.navigate(['/master/price']);
  }

  formatAmount(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  formatDate(value: string): string {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getDisplaySessionName(sessionName: string): string {
    const normalized = this.normalizeSessionName(sessionName);

    if (normalized === 'latelunch') {
      return 'Lunch';
    }

    if (normalized === 'latedinner') {
      return 'Dinner';
    }

    if (normalized === 'breakfast') {
      return 'Breakfast';
    }

    if (normalized === 'lunch') {
      return 'Lunch';
    }

    if (normalized === 'dinner') {
      return 'Dinner';
    }

    return sessionName || '';
  }

  normalizeSessionName(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[\s_-]/g, '')
      .trim();
  }

  normalizePlanType(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  getEarliestDate(values: string[]): string | null {
    if (!values || values.length === 0) {
      return null;
    }

    let earliest: string | null = null;

    values.forEach(value => {
      if (!value) {
        return;
      }

      if (!earliest) {
        earliest = value;
        return;
      }

      const currentDate = new Date(earliest);
      const itemDate = new Date(value);

      if (isNaN(currentDate.getTime()) || itemDate < currentDate) {
        earliest = value;
      }
    });

    return earliest;
  }

  getOrderedDisplaySessions(sessions: string[]): string[] {
    const order = ['Breakfast', 'Lunch', 'Dinner'];

    return [...sessions].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);

      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;

      return ai - bi;
    });
  }

  getOrderedPlans(plans: string[]): string[] {
    const order = ['Basic', 'Standard', 'Premium'];

    return [...plans].sort((a, b) => {
      const ai = order.findIndex(x => this.normalizePlanType(x) === this.normalizePlanType(a));
      const bi = order.findIndex(x => this.normalizePlanType(x) === this.normalizePlanType(b));

      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;

      return ai - bi;
    });
  }
}