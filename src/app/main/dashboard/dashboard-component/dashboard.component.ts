import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface SummaryCard {
  title: string;
  value: string;
  sub: string;
  icon: string;
  theme: string;
}

interface OrderRow {
  orderNo: string;
  company: string;
  session: string;
  cuisine: string;
  location: string;
  qty: number;
  scanned: number;
  total: number;
  status: string;
}

interface AnalyticsMiniCard {
  title: string;
  value: string;
  icon: string;
}

interface AlertItem {
  title: string;
  desc: string;
  type: string;
}

interface TodayCuisineSessionItem {
  cuisine: string;
  session: string;
  orders: number;
}

interface SessionDemandItem {
  label: string;
  value: number;
  count: number;
  class: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  filters: string[] = ['Today', 'This Week', 'This Month', 'By Company', 'By Session', 'By Location'];

  summaryCards: SummaryCard[] = [
    {
      title: 'Total Companies',
      value: '128',
      sub: '+12 this month',
      icon: 'briefcase',
      theme: 'primary'
    },
    {
      title: 'Total Orders',
      value: '1,842',
      sub: '246 pending',
      icon: 'shopping-bag',
      theme: 'info'
    },
    {
      title: 'QR Generated',
      value: '5,640',
      sub: '420 active today',
      icon: 'grid',
      theme: 'pink'
    }
   
  ];

  sessionDemand: SessionDemandItem[] = [
    { label: 'Breakfast', value: 26, count: 212, class: 'purple-dot' },
    { label: 'Lunch', value: 44, count: 788, class: 'blue-dot' },
    { label: 'Dinner', value: 30, count: 532, class: 'green-dot' }
  ];

  orderRows: OrderRow[] = [
    {
      orderNo: 'ORD-10021',
      company: 'Aachi Foods',
      session: 'Lunch',
      cuisine: 'South Indian',
      location: 'Chennai',
      qty: 220,
      scanned: 198,
      total: 220,
      status: 'Confirmed'
    },
    {
      orderNo: 'ORD-10022',
      company: 'Sun Feast',
      session: 'Dinner',
      cuisine: 'North Indian',
      location: 'Bangalore',
      qty: 140,
      scanned: 96,
      total: 140,
      status: 'Pending'
    },
    {
      orderNo: 'ORD-10023',
      company: 'ABC Corp',
      session: 'Breakfast',
      cuisine: 'Continental',
      location: 'Hyderabad',
      qty: 95,
      scanned: 95,
      total: 95,
      status: 'Completed'
    },
    {
      orderNo: 'ORD-10024',
      company: 'Tech Park Ltd',
      session: 'Lunch',
      cuisine: 'Chinese',
      location: 'Pune',
      qty: 180,
      scanned: 122,
      total: 180,
      status: 'In Progress'
    },
    {
      orderNo: 'ORD-10025',
      company: 'Delta Group',
      session: 'Dinner',
      cuisine: 'Mixed',
      location: 'Chennai',
      qty: 260,
      scanned: 174,
      total: 260,
      status: 'In Progress'
    }
  ];

  analyticsCards: AnalyticsMiniCard[] = [
    { title: 'Average Order Processing', value: '18 min', icon: 'clock' },
    { title: 'QR Validation Accuracy', value: '98.3%', icon: 'check-circle' },
    { title: 'Scan Completion Rate', value: '87.6%', icon: 'activity' },
    { title: 'Pending Actions', value: '29', icon: 'alert-circle' }
  ];

  scannerBreakdown = [
    { label: 'Success', value: 2940, percentage: 92 },
    { label: 'Duplicate', value: 118, percentage: 18 },
    { label: 'Invalid', value: 43, percentage: 8 },
    { label: 'Manual Entry', value: 21, percentage: 5 },
    { label: 'Pending Sync', value: 92, percentage: 16 }
  ];

  todayCuisineSessionSummary: TodayCuisineSessionItem[] = [
    { cuisine: 'South Indian', session: 'Breakfast', orders: 148 },
    { cuisine: 'South Indian', session: 'Lunch', orders: 286 },
    { cuisine: 'North Indian', session: 'Lunch', orders: 164 },
    { cuisine: 'Chinese', session: 'Dinner', orders: 121 },
    { cuisine: 'Continental', session: 'Breakfast', orders: 96 },
    { cuisine: 'Mixed', session: 'Dinner', orders: 178 }
  ];

  alerts: AlertItem[] = [
    {
      title: 'Override approvals pending',
      desc: '6 override requests need approval now',
      type: 'warning'
    },
    {
      title: 'QR batches expiring',
      desc: '3 QR batches expire in the next 2 hours',
      type: 'danger'
    },
    {
      title: 'Scanner status healthy',
      desc: 'Uptime is 99.2% with stable response',
      type: 'success'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loadIcons();
    feather.replace();
  }

  loadIcons(): void {
    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);
  }

  getSummaryProgress(title: string): number {
    switch (title) {
      case 'Total Companies':
        return 62;
      case 'Total Orders':
        return 84;
      case 'QR Generated':
        return 76;
      
      default:
        return 50;
    }
  }

  // getSessionTotalOrders(): number {
  //   return this.sessionDemand.reduce((sum, item) => sum + item.count, 0);
  // }

  getOrderProgress(scanned: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Math.round((scanned / total) * 100);
  }

  getCuisineSessionProgress(orderCount: number): number {
    const maxOrders = Math.max(...this.todayCuisineSessionSummary.map(x => x.orders), 1);
    return Math.round((orderCount / maxOrders) * 100);
  }

  getCuisineBarClass(index: number): string {
    const classes = ['bar-purple', 'bar-cyan', 'bar-green', 'bar-orange', 'bar-pink', 'bar-indigo'];
    return classes[index % classes.length];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'badge-confirmed';
      case 'Pending':
        return 'badge-pending';
      case 'Completed':
        return 'badge-completed';
      case 'In Progress':
        return 'badge-progress';
      default:
        return 'badge-default';
    }
  }

  getAlertClass(type: string): string {
    switch (type) {
      case 'warning':
        return 'alert-warning';
      case 'danger':
        return 'alert-danger';
      case 'success':
        return 'alert-success';
      default:
        return 'alert-default';
    }
  }
}