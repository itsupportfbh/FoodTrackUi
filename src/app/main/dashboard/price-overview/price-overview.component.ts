import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

interface PriceOverviewItem {
  label: string;
  sessionId: number;
  session: string;
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
  totalPrice = 0;

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

    const dashboard = this.dashboardData || {};
    const sessionRows = this.getFilteredSessionRows();

    // backend final total
    this.totalPrice = Number(dashboard.totalPrice || 0);

   const breakdown = dashboard.sessionPriceBreakdown || [];

   const computedRows: PriceOverviewItem[] = sessionRows
      .map((row: any) => {
        const sessionName = String(row.sessionName || row.label || '').trim();
        const sessionId = Number(row.sessionId || row.id || 0);
        const qty = Number(row.totalQty || row.qty || 0);

        // match backend session total
        const match = breakdown.find(
          (b: any) =>
            b.sessionId === sessionId ||
            String(b.sessionName || '').toLowerCase() === sessionName.toLowerCase()
        );

        return {
          label: sessionName,
          sessionId,
          session: sessionName,
          qty,
          totalPrice: Number(match?.totalPrice || 0),
          percent: 0
        };
      }).filter((item: PriceOverviewItem) => item.qty > 0)
          .sort((a: PriceOverviewItem, b: PriceOverviewItem) => {
            const aIndex = this.getSessionOrder(a.session);
            const bIndex = this.getSessionOrder(b.session);

            if (aIndex !== bIndex) {
              return aIndex - bIndex;
            }

            return b.qty - a.qty;
          });

    this.totalQty = computedRows.reduce((sum, item) => sum + item.qty, 0);

    const totalQtyValue = this.totalQty > 0 ? this.totalQty : 1;

    this.allItems = computedRows.map((item: PriceOverviewItem) => ({
      ...item,
      percent: Math.max(18, Math.round((item.qty / totalQtyValue) * 100))
    }));

    this.items = [...this.allItems];

    this.bindChartColumns();
    this.loading = false;
  }

  private getSessionOrder(sessionName: string): number {
    const index = this.sessionDisplayOrder.indexOf(String(sessionName || '').trim().toLowerCase());
    return index === -1 ? 999 : index;
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
      value: item.qty
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

  get totalCalculatedPrice(): number {
    return this.totalPrice;
  }
}