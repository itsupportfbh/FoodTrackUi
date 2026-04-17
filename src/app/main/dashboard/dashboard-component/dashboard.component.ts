import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '../dashboard-services/dashboard.service';
import { SessionService } from 'app/main/Master/session/session.service';
import { LocationService } from 'app/main/Master/location/location.service';
import { CateringService } from 'app/main/services/catering.service';

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

  filters: any = {
    companyIds: [],
    sessionIds: [],
    locationIds: [],
    fromDate: null,
    toDate: null
  };

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
    this.filters = {
      companyIds: [],
      sessionIds: [],
      locationIds: [],
      fromDate: null,
      toDate: null
    };

    this.loadDashboard();
  }
}