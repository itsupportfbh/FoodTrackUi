import { Component } from '@angular/core';
import { CateringService } from '../services/catering.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent {
  form: any = {
    companyId: 1,
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    billingDate: new Date().toISOString().substring(0, 10),
    userId: 1
  };

  response: any = null;

  constructor(private srv: CateringService) {}

  generate(): void {
    this.srv.generateMonthlyBilling(this.form).subscribe(res => this.response = res);
  }
}
