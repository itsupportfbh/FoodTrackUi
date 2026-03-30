import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  cards = [
    { label: 'Ordered vs Scanned', value: '92% matched' },
    { label: 'Missed Meals', value: '74' },
    { label: 'Duplicate Scan Attempts', value: '19' },
    { label: 'Extra Meals', value: '12' }
  ];
}
