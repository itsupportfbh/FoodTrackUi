import { Component } from '@angular/core';
import { CateringService } from '../services/catering.service';

@Component({
  selector: 'app-daily-order',
  templateUrl: './daily-order.component.html',
  styleUrls: ['./daily-order.component.scss']
})
export class DailyOrderComponent {
  form: any = {
    companyId: 1,
    locationId: null,
    mealType: 'Lunch',
    orderDate: new Date().toISOString().substring(0, 10)
  };

  result: any = null;

  constructor(private srv: CateringService) {}

  loadFinalQty(): void {
    this.srv.getFinalQty(this.form.companyId, this.form.locationId, this.form.mealType, this.form.orderDate)
      .subscribe(res => this.result = res);
  }
}
