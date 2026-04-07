import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface TodayCuisineSessionItem {
  cuisine: string;
  session: string;
  orders: number;
}

@Component({
  selector: 'app-cuisine-session-performance',
  templateUrl: './cuisine-session-performance.component.html',
  styleUrls: ['./cuisine-session-performance.component.scss']
})
export class CuisineSessionPerformanceComponent implements OnInit, AfterViewInit {

  todayCuisineSessionSummary: TodayCuisineSessionItem[] = [
    { cuisine: 'South Indian', session: 'Breakfast', orders: 148 },
    { cuisine: 'South Indian', session: 'Lunch', orders: 286 },
    { cuisine: 'North Indian', session: 'Lunch', orders: 164 },
    { cuisine: 'Chinese', session: 'Dinner', orders: 121 },
    { cuisine: 'Continental', session: 'Breakfast', orders: 96 },
    { cuisine: 'Mixed', session: 'Dinner', orders: 178 }
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    feather.replace();
  }

  getCuisineBarClass(index: number): string {
  const classes = ['bar-purple', 'bar-cyan', 'bar-green', 'bar-orange', 'bar-pink', 'bar-indigo'];
  return classes[index % classes.length];
}

getCuisineAccentClass(index: number): string {
  const classes = ['accent-purple', 'accent-cyan', 'accent-green', 'accent-orange', 'accent-pink', 'accent-indigo'];
  return classes[index % classes.length];
}

getCuisineSoftClass(index: number): string {
  const classes = ['soft-purple', 'soft-cyan', 'soft-green', 'soft-orange', 'soft-pink', 'soft-indigo'];
  return classes[index % classes.length];
}

getCuisineSessionProgress(orderCount: number): number {
  if (!this.todayCuisineSessionSummary?.length) return 0;
  const max = Math.max(...this.todayCuisineSessionSummary.map((x: any) => x.orders || 0), 1);
  return (orderCount / max) * 100;
}
}