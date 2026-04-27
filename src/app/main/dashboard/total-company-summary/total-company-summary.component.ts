import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as feather from 'feather-icons';

interface SummaryCard {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  theme: 'primary' | 'info' | 'pink' | 'success' | 'warning' | 'purple';
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

  const totalCompanies = Number(res.totalCompanies ?? 0);
  const totalOrders = Number(res.totalOrders ?? 0);
  const approvedQty = Number(res.monthOrderedQty ?? res.totalQRCodes ?? 0);
  const redeemedQty = Number(res.monthRedeemedQty ?? res.todayScans ?? 0);
  const pendingQty = Number(res.monthPendingQty ?? Math.max(0, approvedQty - redeemedQty));
  const totalPrice = Number(res.totalPrice ?? 0);

  this.summaryCards = [
    {
      title: 'Companies',
      value: String(totalCompanies),
      subtitle: 'active companies',
      icon: 'briefcase',
      theme: 'primary'
    },
    {
      title: 'Total Orders',
      value: String(totalOrders),
      subtitle: `${approvedQty} approved QR`,
      icon: 'file-text',
      theme: 'info'
    },
    {
      title: 'Approved QR',
      value: String(approvedQty),
      subtitle: `${redeemedQty} redeemed · ${pendingQty} pending`,
      icon: 'check-square',
      theme: 'pink'
    },
    {
      title: 'Revenue',
      value: `S$ ${totalPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      subtitle: `${approvedQty} qty`,
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