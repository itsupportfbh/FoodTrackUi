import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';
import { DashboardService } from '../dashboard-services/dashboard.service';

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
export class TotalCompanySummaryComponent implements OnInit, AfterViewInit {
  summaryCards: SummaryCard[] = [];
  dashboardData: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  loadDashboardSummary(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res: any) => {
        this.dashboardData = res;

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
      },
      error: err => {
        console.error('Dashboard summary load error:', err);

        this.summaryCards = [
          {
            title: 'Total Companies',
            value: '0',
            sub: '0 company wise entries',
            icon: 'briefcase',
            theme: 'primary',
            progress: 62
          },
          {
            title: 'Today Ordered',
            value: '0',
            sub: '0 redeemed • 0 pending',
            icon: 'shopping-bag',
            theme: 'info',
            progress: 84
          },
          {
            title: 'This Month Ordered',
            value: '0',
            sub: '0 redeemed • 0 pending',
            icon: 'bar-chart-2',
            theme: 'pink',
            progress: 76
          },
          {
            title: 'QR Generated',
            value: '0',
            sub: '0 latest used',
            icon: 'grid',
            theme: 'success',
            progress: 71
          }
        ];
      }
    });
  }
}