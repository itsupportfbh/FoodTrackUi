import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CuisinePriceService } from '../cuisine-price.service';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceListComponent implements OnInit {
  loading = false;

  summary: any = null;
  planCards: any[] = [];

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
        const rawRows = (res || [])
          .map((item: any) => ({
            id: item.id,
            priceId: item.priceId,
            companyId: item.companyId,
            companyName: item.companyName,
            sessionId: item.sessionId,
            sessionName: item.sessionName,
            planType: item.planType,
            rate: Number(item.rate || 0),
            effectiveFrom: item.effectiveFrom,
            isCurrent: item.isCurrent
          }))
          .filter((item: any) => item.isCurrent);

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

  buildView(data: any[]): void {
    if (!data || data.length === 0) {
      this.summary = null;
      this.planCards = [];
      return;
    }

    const uniqueSessions = [...new Set(data.map(x => x.sessionName).filter(Boolean))];
    const uniquePlans = [...new Set(data.map(x => x.planType).filter(Boolean))];

    let earliestEffectiveFrom = data[0]?.effectiveFrom || null;

    data.forEach(item => {
      if (item.effectiveFrom) {
        const currentDate = new Date(earliestEffectiveFrom);
        const itemDate = new Date(item.effectiveFrom);

        if (isNaN(currentDate.getTime()) || itemDate < currentDate) {
          earliestEffectiveFrom = item.effectiveFrom;
        }
      }
    });

    this.summary = {
      title: 'Default For All Companies',
      sessionsText: uniqueSessions.join(', '),
      plansText: uniquePlans.join(', '),
      effectiveFromDisplay: earliestEffectiveFrom ? this.formatDate(earliestEffectiveFrom) : '-'
    };

    const orderedPlans = ['Basic', 'Standard', 'Premium'];

    this.planCards = orderedPlans
      .filter(plan => data.some(x => x.planType === plan))
      .map(plan => {
        const planRows = data.filter(x => x.planType === plan);
        const sessionNames = [...new Set(planRows.map(x => x.sessionName).filter(Boolean))];
        const perDay = planRows.reduce((sum, item) => sum + Number(item.rate || 0), 0);

        let effectiveFrom = planRows[0]?.effectiveFrom || null;

        planRows.forEach(item => {
          if (item.effectiveFrom) {
            const currentDate = new Date(effectiveFrom);
            const itemDate = new Date(item.effectiveFrom);

            if (isNaN(currentDate.getTime()) || itemDate < currentDate) {
              effectiveFrom = item.effectiveFrom;
            }
          }
        });

        return {
          planType: plan,
          sessionNames: sessionNames.join(', '),
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
}