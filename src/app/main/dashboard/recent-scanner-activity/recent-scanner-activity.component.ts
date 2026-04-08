import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as feather from 'feather-icons';
import { DashboardService } from '../dashboard-services/dashboard.service';

interface ScannerActivity {
  qrNo: string;
  companyName: string;
  session: string;
  time: string;
  status: 'Redeemed' | 'Invalid';
}

@Component({
  selector: 'app-recent-scanner-activity',
  templateUrl: './recent-scanner-activity.component.html',
  styleUrls: ['./recent-scanner-activity.component.scss']
})
export class RecentScannerActivityComponent implements OnInit, AfterViewInit, OnDestroy {
  scannerActivities: ScannerActivity[] = [];
  todayScans = 0;
  yesterdayScans = 0;
  scanChange = 0;
  refreshInterval: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadScannerActivities();

    this.refreshInterval = setInterval(() => {
      this.loadScannerActivities();
    }, 10000);
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

 get leftScannerActivities(): ScannerActivity[] {
  const mid = Math.ceil(this.scannerActivities.length / 2);
  return this.scannerActivities.slice(0, mid);
}

get rightScannerActivities(): ScannerActivity[] {
  const mid = Math.ceil(this.scannerActivities.length / 2);
  return this.scannerActivities.slice(mid);
}

  loadScannerActivities(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res: any) => {
        this.todayScans = res.todayScans || 0;
        this.yesterdayScans = res.yesterdayScans || 0;

        if (this.yesterdayScans > 0) {
          this.scanChange = Math.round(
            ((this.todayScans - this.yesterdayScans) / this.yesterdayScans) * 100
          );
        } else {
          this.scanChange = this.todayScans > 0 ? 100 : 0;
        }

        const data = res.totallatestUsedQRs || [];

        this.scannerActivities = data.map((item: any) => ({
          qrNo: item.uniqueCode,
          companyName: item.companyName,
          session: item.sessionName || '',
          time: this.formatTime(item.usedDate),
          status: 'Redeemed'
        }));

        setTimeout(() => feather.replace(), 0);
      },
      error: err => {
        console.error('Scanner activity load error:', err);
        this.scannerActivities = [];
      }
    });
  }

 formatTime(date: string): string {
  if (!date) return '-';

  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
  
}