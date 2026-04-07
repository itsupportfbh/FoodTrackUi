import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface SessionDemandItem {
  label: string;
  value: number;
  count: number;
  color: string;
}

@Component({
  selector: 'app-session-demand',
  templateUrl: './session-demand.component.html',
  styleUrls: ['./session-demand.component.scss']
})
export class SessionDemandComponent implements OnInit, AfterViewInit {

  sessionDemand: SessionDemandItem[] = [
    { label: 'Breakfast', value: 12, count: 212, color: '#7367f0' },
    { label: 'Lunch', value: 28, count: 788, color: '#11c5f6' },
    { label: 'Late Lunch', value: 18, count: 420, color: '#ff9f43' },
    { label: 'Dinner', value: 24, count: 532, color: '#28c76f' },
    { label: 'Late Dinner', value: 18, count: 356, color: '#ea5455' }
  ];

  donutGradient = '';

  constructor() {}

  ngOnInit(): void {
    this.buildDonutGradient();
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

  private buildDonutGradient(): void {
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