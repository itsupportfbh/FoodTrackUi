import { Component, OnInit } from '@angular/core';

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
export class RecentScannerActivityComponent implements OnInit {
  scannerActivities: ScannerActivity[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadScannerActivities();
  }

  loadScannerActivities(): void {
    this.scannerActivities = [
      {
        qrNo: 'QR-10021',
        companyName: 'ABC Tech Park',
        session: 'Lunch',
        time: '12:14 PM',
        status: 'Redeemed'
      },
      {
        qrNo: 'QR-10022',
        companyName: 'Nova Logistics',
        session: 'Breakfast',
        time: '09:08 AM',
        status: 'Redeemed'
      },
      {
        qrNo: 'QR-10023',
        companyName: 'Skyline Foods',
        session: 'Dinner',
        time: '07:22 PM',
        status: 'Invalid'
      },
      {
        qrNo: 'QR-10024',
        companyName: 'Urban Systems',
        session: 'Lunch',
        time: '01:05 PM',
        status: 'Redeemed'
      }
    ];
  }
}