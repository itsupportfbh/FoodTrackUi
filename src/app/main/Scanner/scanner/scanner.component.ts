import { Component, OnDestroy, OnInit } from '@angular/core';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { ScannerService } from '../scannerservice';
import { debug } from 'console';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit, OnDestroy {
  private html5QrCode!: Html5Qrcode;
  private isScannerStarted = false;
  private isHandlingResult = false;

  userId = 0;
  companyId = 0;
  scannedText = '';
  scanStatus: 'idle' | 'success' | 'error' | 'permission' = 'idle';
  statusMessage = 'Scanner is getting ready...';

  constructor(private scannerService: ScannerService) { }

  ngOnInit(): void {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.userId = Number(currentUser.id || 0);
      this.companyId = Number(currentUser.companyId || 0);
    }
    this.startScanner();
  }

  async startScanner(): Promise<void> {
    try {
      this.statusMessage = 'Checking camera support...';
      this.scanStatus = 'idle';

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.scanStatus = 'permission';
        this.statusMessage =
          'Camera API is not supported or blocked. Please ensure you are using HTTPS.';
        return;
      }

      this.html5QrCode = new Html5Qrcode('qr-reader');

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.3333
      };

      this.statusMessage = 'Opening front camera...';

      try {
        await this.html5QrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText: string) => {
            this.onScanSuccess(decodedText);
          },
          () => {
            // ignore frame-level errors
          }
        );
      } catch (frontError) {
        console.warn('Front camera failed. Trying back camera...', frontError);

        this.statusMessage =
          'Front camera unavailable. Attempting to use back camera...';

        await this.html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            this.onScanSuccess(decodedText);
          },
          () => {
            // ignore frame-level errors
          }
        );
      }

      this.isScannerStarted = true;
      this.statusMessage = 'Camera ready. Show QR code to scan.';
    } catch (error: any) {
      console.error('Scanner start error:', error);
      this.scanStatus = 'permission';

      const errMessage =
        error?.message || error?.toString() || 'Unknown scanner error';

      this.statusMessage = `Camera could not be opened. ${errMessage}`;
    }
  }

  private async onScanSuccess(decodedText: string): Promise<void> {
    debugger;
    if (this.isHandlingResult) {
      return;
    }

    this.isHandlingResult = true;
    this.scannedText = decodedText;
   // this.scanStatus = 'success';
  //  this.statusMessage = 'QR scanned successfully';

   // console.log('Scanned QR:', decodedText);

    try {

      const UniqueCode = decodedText;

      const response = await this.scannerService.validateScanAsync(UniqueCode).toPromise();

      console.log('Validation successful:', response);

      if (response?.isAllowed === true) {
        Swal.fire({
        title: 'Success',
        text: response?.message,
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
        allowOutsideClick: false
      });
      } else {
        Swal.fire('Warning', response?.message || 'QR code is not valid for this request', 'warning');
      }
    } catch (err: any) {
      console.error('Validation failed:', err);
      this.scanStatus = 'error';
      this.statusMessage = 'QR validation failed';
      Swal.fire('Error', 'QR code validation failed', 'error');
      this.isHandlingResult = false;
    } finally {
      setTimeout(() => {
        this.resetForNextScan();
      }, 2000);
    }
  }

  resetForNextScan(): void {
    this.scannedText = '';
    this.scanStatus = 'idle';
    this.statusMessage = 'Ready for next QR scan';
    this.isHandlingResult = false;
  }

  async stopScanner(): Promise<void> {
    try {
      if (this.html5QrCode && this.isScannerStarted) {
        await this.html5QrCode.stop();
        await this.html5QrCode.clear();
        this.isScannerStarted = false;
      }
    } catch (error) {
      console.error('Scanner stop error:', error);
    }
  }

  async restartScanner(): Promise<void> {
    await this.stopScanner();
    this.scannedText = '';
    this.scanStatus = 'idle';
    this.statusMessage = 'Restarting scanner...';
    this.isHandlingResult = false;
    await this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }
}