import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { QRgenerateComponent } from '../qrgenerate/qrgenerate.component';
import { ListQRComponent } from '../list-qr/list-qr.component';
import { ScannerComponent } from './scanner.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


const routes = [
  {
    path: 'qrgenerate',
    component: QRgenerateComponent,
    data: { animation: 'qrgenerate' }
  },
  {
    path: 'listqr',
    component: ListQRComponent,
    data: { animation: 'listqr' }
  },
  {
    path: 'scanner',
    component: ScannerComponent,
    data: { animation: 'scanner' }
  }
];

@NgModule({
  declarations: [
    QRgenerateComponent,
    ListQRComponent,
    ScannerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    QRCodeModule,
    NgxDatatableModule,
    RouterModule.forChild(routes),
    NgbTooltipModule
  ]
})
export class ScannerModule {}