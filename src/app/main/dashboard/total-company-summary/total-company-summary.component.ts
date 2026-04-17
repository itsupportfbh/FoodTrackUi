import { Component, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface SummaryCard {
  title: string;
  value: string;
  sub: string;
  icon: string;
  theme: 'primary' | 'info' | 'pink' | 'success';
  progress: number;
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

    this.summaryCards = [
      {
        title: 'Total Companies',
        value: (res.totalCompanies ?? 0).toString(),
        sub: `${res.totalcompanyWiseOrders?.length ?? 0} company wise entries`,
        icon: 'briefcase',
        theme: 'primary',
        progress: 62
      },
      {
        title: 'Today Ordered',
        value: (res.todayOrderedQty ?? 0).toString(),
        sub: `${res.todayRedeemedQty ?? 0} redeemed • ${res.todayPendingQty ?? 0} pending`,
        icon: 'shopping-bag',
        theme: 'info',
        progress: 84
      },
      {
        title: 'This Month Ordered',
        value: (res.monthOrderedQty ?? 0).toString(),
        sub: `${res.monthRedeemedQty ?? 0} redeemed • ${res.monthPendingQty ?? 0} pending`,
        icon: 'bar-chart-2',
        theme: 'pink',
        progress: 76
      },
      {
        title: 'QR Generated',
        value: (res.totalQRCodes ?? 0).toString(),
        sub: `${res.totallatestUsedQRs?.length ?? 0} latest used`,
        icon: 'grid',
        theme: 'success',
        progress: 71
      }
    ];

    setTimeout(() => feather.replace(), 0);
  }
}