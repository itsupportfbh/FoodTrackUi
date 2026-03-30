import { Component } from '@angular/core';
import { CateringService } from '../services/catering.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent {
  form: any = {
    qrToken: '',
    companyId: 1,
    locationId: null,
    mealDate: new Date().toISOString().substring(0, 10),
    mealType: 'Breakfast',
    scannedBy: 1,
    deviceId: 'WEB-CAM-01'
  };

  result: any = null;
  error = '';

  constructor(private srv: CateringService) {}

  submit(): void {
    this.error = '';
    this.result = null;

    this.srv.validateAndSaveScan(this.form).subscribe({
      next: (res) => this.result = res,
      error: (err) => this.error = err?.error?.message || err?.message || 'Scan failed'
    });
  }
}
