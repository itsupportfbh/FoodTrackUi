import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as feather from 'feather-icons';

interface SummaryCard {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  theme: 'primary' | 'info' | 'pink' | 'success';
}

@Component({
  selector: 'app-total-company-summary',
  templateUrl: './total-company-summary.component.html',
  styleUrls: ['./total-company-summary.component.scss']
})
export class TotalCompanySummaryComponent implements OnChanges, AfterViewInit {
  @Input() dashboardData: any;
  summaryCards: SummaryCard[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboardData']) {
      this.bindSummary();
    }
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  bindSummary(): void {
  const res = this.dashboardData || {};
  const totalPrice = Number(res.totalPrice ?? 0);

  this.summaryCards = [
    {
      title: 'Companies',
      value: String(res.totalCompanies ?? 0),
      icon: 'briefcase',
      theme: 'primary'
    },
    {
      title: 'Today Redeemed',
      value: String(res.todayRedeemedQty ?? res.todayScans ?? 0),
      subtitle: `${res.todayOrderedQty ?? 0} ordered today`,
      icon: 'check-circle',
      theme: 'info'
    },
    {
      title: 'Month Orders',
      value: String(res.monthOrderedQty ?? 0),
      subtitle: `${res.monthPendingQty ?? 0} pending`,
      icon: 'bar-chart-2',
      theme: 'pink'
    },
    {
      title: 'Total Price',
      value: `S$ ${totalPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      subtitle: `${Number(res.monthOrderedQty ?? 0).toLocaleString()} qty`,
      icon: 'dollar-sign',
      theme: 'success'
    }
  ];

  setTimeout(() => feather.replace(), 0);
}

  private calculateTotalPrice(res: any): number {
    const prices = res?.currentSessionPrices || [];
    const sessionRows = res?.totalOrdersBySession || [];

    const sessionRateMap: { [key: string]: number } = {};

    for (const p of prices) {
      const sessionName = String(p?.sessionName || '').trim().toLowerCase();

      if (!(sessionName in sessionRateMap)) {
        sessionRateMap[sessionName] = Number(p?.rate || 0);
      }
    }

    return sessionRows.reduce((sum: number, row: any) => {
      const sessionName = String(row?.sessionName || '').trim().toLowerCase();
      const qty = Number(row?.totalQty || 0);
      const rate = sessionRateMap[sessionName] || 0;

      return sum + (qty * rate);
    }, 0);
  }
}