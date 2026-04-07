import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class TotalCompanySummaryComponent implements OnInit, AfterViewInit {

  summaryCards: SummaryCard[] = [
    {
      title: 'Total Companies',
      value: '128',
      sub: '+12 this month',
      icon: 'briefcase',
      theme: 'primary',
      progress: 62
    },
    {
      title: 'Total Orders',
      value: '1,842',
      sub: '246 pending',
      icon: 'shopping-bag',
      theme: 'info',
      progress: 84
    },
    {
      title: 'QR Generated',
      value: '5,640',
      sub: '420 active today',
      icon: 'grid',
      theme: 'pink',
      progress: 76
    },
    {
      title: 'Scanner Hits',
      value: '3,214',
      sub: '89 failed scans',
      icon: 'camera',
      theme: 'success',
      progress: 68
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    feather.replace();
  }
}