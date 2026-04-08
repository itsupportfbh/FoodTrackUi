import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';
import { DashboardService } from '../dashboard-services/dashboard.service';

interface TopCompanyItem {
  name: string;
  orders: number;
  share: number;
  cardClass: string;
  badgeClass: string;
  progressClass: string;
  avatarClass: string;
}

@Component({
  selector: 'app-top-companies',
  templateUrl: './top-companies.component.html',
  styleUrls: ['./top-companies.component.scss']
})
export class TopCompaniesComponent implements OnInit, AfterViewInit {

  topCompanies: TopCompanyItem[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadTopCompanies();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  loadTopCompanies(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res: any) => {
        const companies = res.totalcompanyWiseOrders || [];

        const totalOrders = companies.reduce(
          (sum: number, item: any) => sum + (item.totalQty || 0),
          0
        );

        const styles = [
          {
            cardClass: 'card-green',
            badgeClass: 'badge-green',
            progressClass: 'progress-green',
            avatarClass: 'avatar-green'
          },
          {
            cardClass: 'card-purple',
            badgeClass: 'badge-purple',
            progressClass: 'progress-purple',
            avatarClass: 'avatar-purple'
          },
          {
            cardClass: 'card-blue',
            badgeClass: 'badge-blue',
            progressClass: 'progress-blue',
            avatarClass: 'avatar-blue'
          },
          {
            cardClass: 'card-orange',
            badgeClass: 'badge-orange',
            progressClass: 'progress-orange',
            avatarClass: 'avatar-orange'
          }
        ];

        this.topCompanies = companies.map((item: any, index: number) => {
          const share = totalOrders > 0
            ? Math.round((item.totalQty / totalOrders) * 100)
            : 0;

          return {
            name: item.companyName,
            orders: item.totalQty,
            share: share,
            cardClass: styles[index % styles.length].cardClass,
            badgeClass: styles[index % styles.length].badgeClass,
            progressClass: styles[index % styles.length].progressClass,
            avatarClass: styles[index % styles.length].avatarClass
          };
        });

        setTimeout(() => feather.replace(), 0);
      },
      error: err => {
        console.error('Top companies load error:', err);
        this.topCompanies = [];
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
 get leftCompanies(): any[] {
  return this.topCompanies.slice(0, Math.ceil(this.topCompanies.length / 2));
}

get rightCompanies(): any[] {
  return this.topCompanies.slice(Math.ceil(this.topCompanies.length / 2));
}
}