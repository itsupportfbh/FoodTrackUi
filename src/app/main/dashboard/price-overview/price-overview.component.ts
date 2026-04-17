import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

interface PriceOverviewItem {
  companyId: number;
  label: string;
  sessionId: number;
  session: string;
  rate: number;
  qty: number;
  totalPrice: number;
  percent: number;
}

interface PriceChartColumn {
  label: string;
  value: number;
  percent: number;
  highlighted: boolean;
}

@Component({
  selector: 'app-price-overview',
  templateUrl: './price-overview.component.html',
  styleUrls: ['./price-overview.component.scss']
})
export class PriceOverviewComponent implements OnChanges {
  @Input() filters: any;
  @Input() dashboardData: any;

  allItems: PriceOverviewItem[] = [];
  items: PriceOverviewItem[] = [];
  chartColumns: PriceChartColumn[] = [];
  loading = false;
  totalQty = 0;

  private readonly sessionDisplayOrder = [
    'breakfast',
    'lunch',
    'dinner',
    'late lunch',
    'late dinner'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] || changes['dashboardData']) {
      this.loadPriceOverview();
    }
  }

  loadPriceOverview(): void {
    this.loading = true;

    const currentPrices = this.dashboardData?.currentSessionPrices || [];
    const sessionRows = this.getFilteredSessionRows();
    const sessionRateMap = this.buildSessionRateMap(currentPrices);

    const computedRows: PriceOverviewItem[] = sessionRows
      .map((row: any) => {
        const sessionName = String(row.sessionName || row.label || '').trim();
        const sessionKey = sessionName.toLowerCase();
        const qty = Number(row.totalQty || row.qty || 0);
        const rate = sessionRateMap[sessionKey] || 0;

        return {
          companyId: 0,
          label: sessionName,
          sessionId: Number(row.sessionId || row.id || 0),
          session: sessionName,
          rate,
          qty,
          totalPrice: rate * qty,
          percent: 0
        };
      })
      .filter((item: PriceOverviewItem) => item.qty > 0 || item.rate > 0)
      .sort((a: PriceOverviewItem, b: PriceOverviewItem) => {
        const aIndex = this.getSessionOrder(a.session);
        const bIndex = this.getSessionOrder(b.session);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        return b.totalPrice - a.totalPrice;
      });

    const maxAmount = computedRows.length
      ? Math.max(...computedRows.map((item: PriceOverviewItem) => item.totalPrice))
      : 0;

    this.totalQty = computedRows.reduce((sum, item) => sum + item.qty, 0);

    this.allItems = computedRows.map((item: PriceOverviewItem) => ({
      ...item,
      percent: maxAmount > 0 ? Math.round((item.totalPrice / maxAmount) * 100) : 0
    }));

    this.items = [...this.allItems];

    this.bindChartColumns();
    this.loading = false;
  }

  private getSessionOrder(sessionName: string): number {
    const index = this.sessionDisplayOrder.indexOf(String(sessionName || '').trim().toLowerCase());
    return index === -1 ? 999 : index;
  }

  private buildSessionRateMap(prices: any[]): { [key: string]: number } {
    const map: { [key: string]: number } = {};

    prices
      .filter((item: any) => this.matchesFilters(item))
      .forEach((item: any) => {
        const sessionKey = String(item.sessionName || '').trim().toLowerCase();
        const rate = Number(item.rate || 0);

        if (!(sessionKey in map)) {
          map[sessionKey] = rate;
        }
      });

    return map;
  }

  private getFilteredSessionRows(): any[] {
    const dashboard = this.dashboardData || {};
    const sessionRows = dashboard.totalOrdersBySession || [];
    const sessionIds = this.filters?.sessionIds || [];

    if (sessionIds.length) {
      return sessionRows.filter((row: any) =>
        sessionIds.includes(row.sessionId) || sessionIds.includes(row.id)
      );
    }

    return sessionRows;
  }

  bindChartColumns(): void {
    const grouped = this.items.map((item: PriceOverviewItem) => ({
      label: item.session,
      value: item.totalPrice
    }));

    const maxValue = grouped.length
      ? Math.max(...grouped.map((item: any) => item.value))
      : 0;

    const highlightedLabel = grouped.length
      ? grouped.reduce((prev: any, current: any) =>
          current.value > prev.value ? current : prev
        ).label
      : '';

    this.chartColumns = grouped.map((item: any) => ({
      label: item.label,
      value: item.value,
      percent: maxValue > 0 ? Math.max(18, Math.round((item.value / maxValue) * 100)) : 0,
      highlighted: item.label === highlightedLabel
    }));
  }

  matchesFilters(item: any): boolean {
    const companyIds = this.filters?.companyIds || [];
    const sessionIds = this.filters?.sessionIds || [];
    const fromDate = this.filters?.fromDate;
    const toDate = this.filters?.toDate;

    if (companyIds.length && !companyIds.includes(item.companyId)) {
      return false;
    }

    if (sessionIds.length && !sessionIds.includes(item.sessionId)) {
      return false;
    }

    if (fromDate || toDate) {
      const effectiveFrom = item.effectiveFrom ? new Date(item.effectiveFrom) : null;

      if (effectiveFrom && fromDate && effectiveFrom < new Date(fromDate)) {
        return false;
      }

      if (effectiveFrom && toDate && effectiveFrom > new Date(toDate)) {
        return false;
      }
    }

    return true;
  }

  get totalActivePrices(): number {
    return this.allItems.length;
  }

  get totalCalculatedPrice(): number {
    return this.allItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }
}