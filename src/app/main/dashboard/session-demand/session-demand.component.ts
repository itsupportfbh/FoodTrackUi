import { Component, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface SessionDemandItem {
  label: string;
  value: number;
  count: number;
  color: string;
  strokeDasharray?: string;
  strokeDashoffset?: number;
}

@Component({
  selector: 'app-session-demand',
  templateUrl: './session-demand.component.html',
  styleUrls: ['./session-demand.component.scss']
})
export class SessionDemandComponent implements OnChanges, AfterViewInit {
  @Input() dashboardData: any;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboardData']) {
      this.bindSessionDemand();
    }
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

bindSessionDemand(): void {
  const sessionRows = this.dashboardData?.totalOrdersBySession || [];
  const planRows = this.dashboardData?.totalOrdersByPlanType || [];

  const sourceRows = sessionRows.length
    ? sessionRows.map((x: any) => ({
        label: x.sessionName || 'Unknown Session',
        totalQty: Number(x.totalQty || 0)
      }))
    : planRows.map((x: any) => ({
        label: x.planType || 'Unknown Plan',
        totalQty: Number(x.totalQty || 0)
      }));

  const totalQty = sourceRows.reduce(
    (sum: number, item: any) => sum + Number(item.totalQty || 0),
    0
  );

  let cumulativePercentage = 0;

  this.sessionDemand = sourceRows
    .filter((item: any) => Number(item.totalQty || 0) > 0)
    .map((item: any, index: number) => {
      const percentage = totalQty > 0 ? (item.totalQty / totalQty) * 100 : 0;
      const dashLength = (percentage / 100) * this.circumference;
      const gapLength = this.circumference - dashLength;

      const mappedItem: SessionDemandItem = {
        label: item.label,
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