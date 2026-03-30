import { Component, OnInit } from '@angular/core';
import { CateringService } from '../services/catering.service';

@Component({
  selector: 'app-company-master',
  templateUrl: './company-master.component.html',
  styleUrls: ['./company-master.component.scss']
})
export class CompanyMasterComponent implements OnInit {
  companies: any[] = [];
  form: any = {
    id: null,
    companyCode: '',
    companyName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    billingType: 'Per Person',
    breakfastRate: 0,
    lunchRate: 0,
    dinnerRate: 0,
    userId: 1
  };
  companyList: any;

  constructor(private srv: CateringService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.srv.getCompanies().subscribe({
    next: (res:any) => {
      this.companyList = res.data || [];
      console.log('API Response:', res);
    },
    error: (err) => {
      console.error('API Error:', err);
      this.companyList = [];
    }
  });
  }

  edit(row: any): void {
    this.form = { ...row, userId: 1 };
  }

  save(): void {
    this.srv.saveCompany(this.form).subscribe(() => {
      this.reset();
      this.loadCompanies();
    });
  }

  reset(): void {
    this.form = {
      id: null,
      companyCode: '',
      companyName: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      billingType: 'Per Person',
      breakfastRate: 0,
      lunchRate: 0,
      dinnerRate: 0,
      userId: 1
    };
  }
}
