import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '../dashboard-services/dashboard.service';
import { SessionService } from 'app/main/Master/session/session.service';
import { LocationService } from 'app/main/Master/location/location.service';
import { CateringService } from 'app/main/services/catering.service';

interface DashboardFilters {
  companyIds: any[];
  sessionIds: any[];
  locationIds: any[];
  fromDate: string;
  toDate: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  dashboardData: any = null;

  companyList: any[] = [];
  sessionList: any[] = [];
  locationList: any[] = [];

  filters: DashboardFilters = this.createDefaultFilters();

  constructor(
    private dashboardService: DashboardService,
    private companyService: CateringService,
    private sessionService: SessionService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadDashboard();
  }

  loadDropdowns(): void {
    this.companyService.getCompanies().subscribe({
      next: (res: any) => {
        this.companyList = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Company dropdown error:', err);
        this.companyList = [];
      }
    });

    this.sessionService.getSession().subscribe({
      next: (res: any) => {
        this.sessionList = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Session dropdown error:', err);
        this.sessionList = [];
      }
    });

    this.locationService.getLocation().subscribe({
      next: (res: any) => {
        this.locationList = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Location dropdown error:', err);
        this.locationList = [];
      }
    });
  }

  loadDashboard(): void {
    const payload = {
      companyIds: this.filters.companyIds || [],
      sessionIds: this.filters.sessionIds || [],
      locationIds: this.filters.locationIds || [],
      fromDate: this.filters.fromDate || null,
      toDate: this.filters.toDate || null
    };

    this.dashboardService.getDashboardData(payload).subscribe({
      next: (res: any) => {
        this.dashboardData = res;
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.dashboardData = null;
      }
    });
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  resetFilters(): void {
    this.filters = this.createDefaultFilters();

    this.loadDashboard();
  }

  private createDefaultFilters(): DashboardFilters {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      companyIds: [],
      sessionIds: [],
      locationIds: [],
      fromDate: this.formatDateForInput(firstDayOfMonth),
      toDate: this.formatDateForInput(lastDayOfMonth)
    };
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
