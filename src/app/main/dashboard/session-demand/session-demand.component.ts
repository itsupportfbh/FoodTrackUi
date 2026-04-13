import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';
import { DashboardService } from '../dashboard-services/dashboard.service';

interface SessionDemandItem {
  label: string;
  value: number;
  count: number;
  color: string;
  strokeDasharray?: string;
  strokeDashoffset?: number;
}

interface DashboardSummaryResponse {
  totalCompanies: number;
  totalOrders: number;
  totalQRCodes: number;
  todayScans: number;
  yesterdayScans: number;
  todayOrderedQty: number;
  todayRedeemedQty: number;
  todayPendingQty: number;
  monthOrderedQty: number;
  monthRedeemedQty: number;
  monthPendingQty: number;
  totalOrdersBySession: {
    sessionName: string;
    totalQty: number;
  }[];
  totalcompanyWiseOrders: {
    companyId: number;
    companyName: string;
    totalQty: number;
    redeemQty: number;
    pendingQty: number;
  }[];
  totallatestUsedQRs: any[];
}

@Component({
  selector: 'app-session-demand',
  templateUrl: './session-demand.component.html',
  styleUrls: ['./session-demand.component.scss']
})
export class SessionDemandComponent implements OnInit, AfterViewInit {
  sessionDemand: SessionDemandItem[] = [];

  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData: SessionDemandItem | null = null;

  private readonly radius = 70;
  private readonly circumference = 2 * Math.PI * this.radius;

  private sessionColors: string[] = [
    '#7367f0',
    '#11c5f6',
    '#ff9f43',
    '#28c76f',
    '#ea5455',
    '#00cfe8',
    '#826af9'
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadSessionDemand();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  get leftSessionDemand(): SessionDemandItem[] {
    const mid = Math.ceil(this.sessionDemand.length / 2);
    return this.sessionDemand.slice(0, mid);
  }

  get rightSessionDemand(): SessionDemandItem[] {
    const mid = Math.ceil(this.sessionDemand.length / 2);
    return this.sessionDemand.slice(mid);
  }

  getSessionTotalOrders(): number {
    return this.sessionDemand.reduce((sum, item) => sum + item.count, 0);
  }

  loadSessionDemand(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res: DashboardSummaryResponse) => {
        const sessions = res.totalOrdersBySession || [];
        const totalQty = sessions.reduce((sum, item) => sum + (item.totalQty || 0), 0);

        let cumulativePercentage = 0;

        this.sessionDemand = sessions.map((item, index) => {
          const percentage = totalQty > 0 ? (item.totalQty / totalQty) * 100 : 0;
          const dashLength = (percentage / 100) * this.circumference;
          const gapLength = this.circumference - dashLength;

          const mappedItem: SessionDemandItem = {
            label: item.sessionName,
            count: Number(item.totalQty || 0),
            value: +percentage.toFixed(1),
            color: this.sessionColors[index % this.sessionColors.length],
            strokeDasharray: `${dashLength} ${gapLength}`,
            strokeDashoffset: -((cumulativePercentage / 100) * this.circumference)
          };

          cumulativePercentage += percentage;
          return mappedItem;
        });

        setTimeout(() => feather.replace(), 0);
      },
      error: err => {
        console.error('Session demand load error:', err);
        this.sessionDemand = [];
      }
    });
  }

  showTooltip(item: SessionDemandItem, event: MouseEvent): void {
    this.tooltipData = item;
    this.tooltipVisible = true;
    this.tooltipX = event.offsetX + 14;
    this.tooltipY = event.offsetY - 10;
  }

  moveTooltip(event: MouseEvent): void {
    if (!this.tooltipVisible) return;
    this.tooltipX = event.offsetX + 14;
    this.tooltipY = event.offsetY - 10;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
    this.tooltipData = null;
  }
}