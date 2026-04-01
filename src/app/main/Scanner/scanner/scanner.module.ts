import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';

import { QRgenerateComponent } from '../qrgenerate/qrgenerate.component';
import { ListQRComponent } from '../list-qr/list-qr.component';

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
  }
];

@NgModule({
  declarations: [
    QRgenerateComponent,
    ListQRComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    QRCodeModule,
    RouterModule.forChild(routes)
  ]
})
export class ScannerModule { 

}