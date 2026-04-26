import { Component, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import { MealRequestService } from '../meal-request-service/meal-request.service';

interface ShowQrItem {
  qrImageId: number;
  qrCodeImage: string;
  qrCodeText: string;
  planType: string;
  imageSrc?: string;
}

@Component({
  selector: 'app-show-qr',
  templateUrl: './show-qr.component.html',
  styleUrls: ['./show-qr.component.scss']
})
export class ShowQrComponent implements OnInit {
  qrList: ShowQrItem[] = [];
  loading = false;

  companyId = 0;
  userId = 0;

  constructor(private mealRequestService: MealRequestService) {}

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    this.companyId = Number(currentUser.companyId || currentUser.CompanyId || 0);
    this.userId = Number(currentUser.id || currentUser.Id || currentUser.userId || 0);

    this.loadQr();
  }

  loadQr(): void {
    if (!this.companyId || !this.userId) {
      Swal.fire('Error', 'Company or user details missing. Please login again.', 'error');
      return;
    }

    this.loading = true;

    this.mealRequestService.ShowQr(this.companyId, this.userId).subscribe({
      next: (res: any) => {
        const list = res?.data || [];

        this.qrList = list.map((x: any) => ({
          qrImageId: x.qrImageId ?? x.QrImageId,
          qrCodeImage: x.qrCodeImage ?? x.QrCodeImage,
          qrCodeText: x.qrCodeText ?? x.QrCodeText,
          planType: x.planType ?? x.PlanType,
          imageSrc: this.toImageSrc(x.qrCodeImage ?? x.QrCodeImage)
        }));

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Unable to load QR code.', 'error');
      }
    });
  }

  private toImageSrc(image: string): string {
    if (!image) return '';

    if (image.startsWith('data:image')) {
      return image;
    }

    return `data:image/png;base64,${image}`;
  }
}