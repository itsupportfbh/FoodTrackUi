import { Component, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

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
export class RecentScannerActivityComponent implements OnChanges, AfterViewInit {
  @Input() dashboardData: any;

  scannerActivities: ScannerActivity[] = [];
  todayScans = 0;
  yesterdayScans = 0;
  scanChange = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboardData']) {
      this.bindScannerActivities();
    }
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  bindScannerActivities(): void {
    const res = this.dashboardData || {};

    this.todayScans = Number(res.todayScans || 0);
    this.yesterdayScans = Number(res.yesterdayScans || 0);

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
  }

  get leftScannerActivities(): ScannerActivity[] {
    const mid = Math.ceil(this.scannerActivities.length / 2);
    return this.scannerActivities.slice(0, mid);
  }

  get rightScannerActivities(): ScannerActivity[] {
    const mid = Math.ceil(this.scannerActivities.length / 2);
    return this.scannerActivities.slice(mid);
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