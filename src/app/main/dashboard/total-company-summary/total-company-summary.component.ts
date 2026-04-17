import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as feather from 'feather-icons';

interface SummaryCard {
  title: string;
  value: string;
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

    this.summaryCards = [
      {
        title: 'Companies',
        value: (res.totalCompanies ?? 0).toString(),
        icon: 'briefcase',
        theme: 'primary'
      },
      {
        title: 'Today Orders',
        value: (res.todayOrderedQty ?? 0).toString(),
        icon: 'shopping-bag',
        theme: 'info'
      },
      {
        title: 'Month Orders',
        value: (res.monthOrderedQty ?? 0).toString(),
        icon: 'bar-chart-2',
        theme: 'pink'
      },
      {
        title: 'QR Codes',
        value: (res.totalQRCodes ?? 0).toString(),
        icon: 'grid',
        theme: 'success'
      }
    ];

    setTimeout(() => feather.replace(), 0);
  }
}
