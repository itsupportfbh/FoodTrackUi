import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as feather from 'feather-icons';

interface TopCompany {
  name: string;
  orders: number;
}

@Component({
  selector: 'app-top-companies',
  templateUrl: './top-companies.component.html',
  styleUrls: ['./top-companies.component.scss']
})
export class TopCompaniesComponent implements OnInit, AfterViewInit {

  topCompanies: TopCompany[] = [
    { name: 'ABC Foods Pvt Ltd', orders: 245 },
    { name: 'Green Leaf Catering', orders: 228 },
    { name: 'Sri Annapoorna Groups', orders: 214 },
    { name: 'Sunrise Hospitality', orders: 198 },
    { name: 'Elite Meals Company', orders: 187 },
   
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    feather.replace();
  }
}