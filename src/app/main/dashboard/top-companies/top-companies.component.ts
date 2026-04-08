import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface TopCompanyItem {
  name: string;
  orders: number;
  redeemed: number;
  rate: number;
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

   topCompanies: TopCompanyItem[] = [
    {
      name: 'ABC Tech Park',
      orders: 1820,
      redeemed: 1688,
      rate: 92.7,
      cardClass: 'card-green',
      badgeClass: 'badge-green',
      progressClass: 'progress-green',
      avatarClass: 'avatar-green'
    },
    {
      name: 'Skyline Foods',
      orders: 1540,
      redeemed: 1404,
      rate: 91.2,
      cardClass: 'card-purple',
      badgeClass: 'badge-purple',
      progressClass: 'progress-purple',
      avatarClass: 'avatar-purple'
    },
    {
      name: 'Nova Logistics',
      orders: 1215,
      redeemed: 1101,
      rate: 90.6,
      cardClass: 'card-blue',
      badgeClass: 'badge-blue',
      progressClass: 'progress-blue',
      avatarClass: 'avatar-blue'
    },
    {
      name: 'Urban Systems',
      orders: 980,
      redeemed: 876,
      rate: 89.4,
      cardClass: 'card-orange',
      badgeClass: 'badge-orange',
      progressClass: 'progress-orange',
      avatarClass: 'avatar-orange'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => feather.replace());
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }
}