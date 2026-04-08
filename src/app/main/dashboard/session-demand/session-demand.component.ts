import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';
import { DashboardService } from '../dashboard-services/dashboard.service';

interface SessionDemandItem {
  label: string;
  value: number;
  count: number;
  color: string;
}

interface DashboardSummaryResponse {
  totalCompanies: number;
  totalOrders: number;
  totalQRCodes: number;
  totalOrdersBySession: {
    sessionName: string;
    totalQty: number;
  }[];
  totalcompanyWiseOrders: {
    companyId: number;
    companyName: string;
    totalQty: number;
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
  donutGradient = '';

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
        const totalQty = sessions.reduce((sum, item) => sum + item.totalQty, 0);

        this.sessionDemand = sessions.map((item, index) => ({
          label: item.sessionName,
          count: item.totalQty,
          value: totalQty > 0 ? Math.round((item.totalQty / totalQty) * 100) : 0,
          color: this.sessionColors[index % this.sessionColors.length]
        }));

        this.buildDonutGradient();

        setTimeout(() => {
          feather.replace();
        }, 0);
      },
      error: (err) => {
        console.error('Session demand load error:', err);
        this.sessionDemand = [];
        this.buildDonutGradient();
      }
    });
  }

  private buildDonutGradient(): void {
    if (!this.sessionDemand.length) {
      this.donutGradient = 'conic-gradient(#e9ecef 0% 100%)';
      return;
    }

    let start = 0;

    const segments = this.sessionDemand.map(item => {
      const end = start + item.value;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    this.donutGradient = `conic-gradient(${segments.join(', ')})`;
  }
}