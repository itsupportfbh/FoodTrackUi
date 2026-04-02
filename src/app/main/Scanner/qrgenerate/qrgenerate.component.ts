import { Component, AfterViewInit, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ScannerService } from '../scannerservice';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface QrCodeRequestModel {
  id: number;
  companyId: number;
  companyName: string;
  companyEmail?: string;
  requestId: string;
  noofQR: number;
  TotalQty: number;
  qrValidFrom: string;
  qrValidTill: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  createdBy: number;
  updatedBy?: number;
}

export interface QrImage {
  id: number;
  qrcoderequestid: number;
  qrCodeImageBase64: string;
  qrCodeText: string;
  serialNo?: number | null;
  uniqueCode?: string;
  isUsed?: boolean;
  usedDate?: string | null;
  isActive: boolean;
  createdDate?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedDate?: string;
}

export interface SaveQrCodeRequestModel {
  id: number;
  companyId: number;
  companyName: string;
  companyEmail?: string;
  requestId: number;
  noofQR: number;
  TotalQty: number;
  qrValidFrom: string;
  qrValidTill: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  createdBy: number;
  updatedBy?: number;
  qrImageBase64?: string;
  qrImages?: QrImage[];
  
}

interface GeneratedQrItem {
  qrNo: number;
  qrText: string;
  imageBase64?: string;
  serialNo: number | null;
  uniqueCode: string;
  isUsed: boolean;
  usedDate: string | null;
  companyId: number;
  companyName: string;
  companyEmail?: string;
  requestId: string;
  qrValidFrom: string;
  qrValidTill: string;
}

@Component({
  selector: 'app-qrgenerate',
  templateUrl: './qrgenerate.component.html',
  styleUrls: ['./qrgenerate.component.scss']
})
export class QRgenerateComponent implements OnInit, AfterViewInit {
  qrForm!: FormGroup;

  requestList: any[] = [];
  generatedQrList: GeneratedQrItem[] = [];
  qrImagesdownload: any[] = [];
    backendQrText = '';
  backendQrImage = '';
  qrImageBase64Only = '';
  backendUniqueCode = '';

  qrRequest: QrCodeRequestModel = this.getEmptyModel();

  constructor(
    private fb: FormBuilder,
    private scannersettingsService: ScannerService
  ) {}

  ngOnInit(): void {
    this.loadRequestDropdown();

    this.qrForm = this.fb.group({
      id: [0],
      companyId: [0, Validators.required],
      companyName: ['', Validators.required],
      companyEmail: [''],
      requestId: ['', Validators.required],
      noofQR: [0, Validators.required],
      qrValidFrom: ['', Validators.required],
      qrValidTill: ['', Validators.required],
      serialNo: [null],
      uniqueCode: [''],
      isUsed: [false],
      usedDate: [null],
      isActive: [true],
      createdBy: [1],
      updatedBy: [1],
      qrImages: this.fb.array([])
    });

    this.addQrImage();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  get qrImages(): FormArray {
    return this.qrForm.get('qrImages') as FormArray;
  }

  getEmptyModel(): QrCodeRequestModel {
    return {
      id: 0,
      companyId: 0,
      companyName: '',
      companyEmail: '',
      requestId: '',
      noofQR: 0,
      TotalQty: 0,
      qrValidFrom: '',
      qrValidTill: '',
      isActive: true,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      createdBy: 1,
      updatedBy: 1
    };
  }

  createQrImageGroup(): FormGroup {
    return this.fb.group({
      id: [0],
      qrcoderequestid: [0],
      qrCodeImageBase64: [''],
      qrCodeText: [''],
      serialNo: [null],
      uniqueCode: [''],
      isUsed: [false],
      usedDate: [null],
      isActive: [true],
      createdDate: [''],
      createdBy: ['1'],
      updatedDate: [''],
      updatedBy: ['1']
    });
  }

  addQrImage(): void {
    this.qrImages.push(this.createQrImageGroup());
  }

  removeQrImage(index: number): void {
    this.qrImages.removeAt(index);
  }

  onFileSelected(event: any, index: number): void {
    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] || '';
      this.qrImages.at(index).patchValue({
        qrCodeImageBase64: base64
      });
    };
    reader.readAsDataURL(file);
  }

  loadRequestDropdown(): void {
    this.scannersettingsService.getRequestDropdown().subscribe({
      next: (res: any) => {
        this.requestList = res?.data || res || [];
      },
      error: () => {
        Swal.fire('Error', 'Failed to load request dropdown', 'error');
      }
    });
  }

  onRequestChange(): void {
    const selected = this.requestList.find(
      x => String(x.requestId) === String(this.qrRequest.requestId)
    );

    if (selected) {
      this.qrRequest.companyId = Number(selected.companyId || 0);
      this.qrRequest.companyName = selected.companyName || '';
      this.qrRequest.companyEmail = selected.companyEmail || '';
      this.qrRequest.TotalQty = Number(selected.qty || 0);
      this.qrRequest.noofQR = Number(selected.qty || 0);
      this.qrRequest.qrValidFrom = selected.fromDate || '';
      this.qrRequest.qrValidTill = selected.tillDate || '';
    }
  }

  private isFormValid(): boolean {
    const companyId = Number(this.qrRequest.companyId || 0);
    const requestId = Number(this.qrRequest.requestId || 0);
    const companyName = String(this.qrRequest.companyName || '').trim();
    const noofQR = Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0);
    const qrValidFrom = this.qrRequest.qrValidFrom;
    const qrValidTill = this.qrRequest.qrValidTill;

    return (
      companyId > 0 &&
      requestId > 0 &&
      companyName.length > 0 &&
      noofQR > 0 &&
      !!qrValidFrom &&
      !!qrValidTill
    );
  }

  generateQrCodes(): void {
    if (!this.isFormValid()) {
      Swal.fire('Validation', 'Please fill all required fields', 'warning');
      return;
    }

    const from = new Date(this.qrRequest.qrValidFrom);
    const till = new Date(this.qrRequest.qrValidTill);

    if (!isNaN(from.getTime()) && !isNaN(till.getTime()) && till < from) {
      Swal.fire(
        'Invalid Date',
        'Valid Till must be greater than or equal to Valid From',
        'warning'
      );
      return;
    }

    const payload = {
      ...this.qrRequest,
      id: this.qrRequest.id || 0,
      noofQR: Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };

    console.log('FINAL PAYLOAD:', payload);

    this.backendQrImage = '';
    this.backendQrText = '';
    this.qrImageBase64Only = '';
    this.backendUniqueCode = '';
    this.generatedQrList = [];

    this.scannersettingsService.generateQR(payload).subscribe({
      next: (res: any) => {
        console.log('QR response:', res);

        const qrList =
          Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.qrImages) ? res.qrImages :
          Array.isArray(res?.result) ? res.result :
          res ? [res] : [];

        if (!qrList.length) {
          Swal.fire('Error', 'No QR data returned from backend', 'error');
          return;
        }

        const firstQr = qrList[0];

        const imageBase64 =
          firstQr?.imageBase64 ||
          firstQr?.ImageBase64 ||
          firstQr?.imageBytes ||
          firstQr?.ImageBytes ||
          firstQr?.qrImageBase64 ||
          firstQr?.qrCodeImageBase64 ||
          '';

        const qrText =
          firstQr?.text ||
          firstQr?.Text ||
          firstQr?.qrText ||
          firstQr?.qrCodeText ||
          `Request: ${this.qrRequest.requestId}`;

        const uniqueCode =
          firstQr?.uniqueCode ||
          firstQr?.UniqueCode ||
          '';

        if (!imageBase64) {
          console.warn('No QR base64 found in response:', firstQr);
          Swal.fire('Error', 'QR image data not found in response', 'error');
          return;
        }

        this.backendQrImage = `data:image/png;base64,${imageBase64}`;
        this.qrImageBase64Only = imageBase64;
        this.backendQrText = qrText;
        this.backendUniqueCode = uniqueCode;

        this.generatedQrList = qrList.map((item: any, index: number) => ({
  qrNo: index + 1,
  qrText: item?.text || item?.Text || '',
  imageBase64:
    item?.imageBase64 ||
    item?.ImageBase64 ||
    item?.imageBytes ||
    item?.ImageBytes ||
    '',
  serialNo: item?.serialNo || item?.SerialNo || index + 1,
  uniqueCode: item?.uniqueCode || item?.UniqueCode || '',
  isUsed: item?.isUsed ?? item?.IsUsed ?? false,
  usedDate: item?.usedDate || item?.UsedDate || null,
  companyId: this.qrRequest.companyId,
  companyName: this.qrRequest.companyName,
  companyEmail: this.qrRequest.companyEmail,
  requestId: this.qrRequest.requestId,
  qrValidFrom: this.qrRequest.qrValidFrom,
  qrValidTill: this.qrRequest.qrValidTill
}));
        const firstItem = this.generatedQrList[0];

        this.qrForm.patchValue({
          companyId: this.qrRequest.companyId,
          companyName: this.qrRequest.companyName,
          companyEmail: this.qrRequest.companyEmail,
          requestId: this.qrRequest.requestId,
          noofQR: this.qrRequest.noofQR || this.qrRequest.TotalQty,
          qrValidFrom: this.qrRequest.qrValidFrom,
          qrValidTill: this.qrRequest.qrValidTill,
          serialNo: firstItem?.serialNo || null,
          uniqueCode: firstItem?.uniqueCode || '',
          isUsed: firstItem?.isUsed ?? false,
          usedDate: firstItem?.usedDate || null
        });

        Swal.fire('Success', 'QR generated successfully', 'success');
        this.onSubmit();
      },
      error: (err: any) => {
        console.error('Generate QR error:', err);
        Swal.fire('Error', 'Failed to generate QR', 'error');
      }
    });
  }

  generateFrontendQR(): void {
    const total = Number(this.qrRequest.TotalQty || this.qrRequest.noofQR || 0);

    if (!total || total <= 0) {
      Swal.fire('Validation', 'TotalQty should be greater than 0', 'warning');
      return;
    }

    this.generatedQrList = Array.from({ length: total }, (_, i) => {
      const serialNo = i + 1;
      const uniqueCode = `CSPL-${this.qrRequest.requestId}-CMP-${this.qrRequest.companyId}-SR-${String(serialNo).padStart(4, '0')}`;

      return {
        qrNo: serialNo,
        serialNo,
        uniqueCode,
        isUsed: false,
        usedDate: null,
        companyId: this.qrRequest.companyId,
        companyName: this.qrRequest.companyName,
        companyEmail: this.qrRequest.companyEmail || '',
        requestId: this.qrRequest.requestId,
        qrValidFrom: this.qrRequest.qrValidFrom,
        qrValidTill: this.qrRequest.qrValidTill,
        qrText: JSON.stringify({
          requestId: this.qrRequest.requestId,
          companyId: this.qrRequest.companyId,
          companyName: this.qrRequest.companyName,
          serialNo,
          uniqueCode,
          validFrom: this.qrRequest.qrValidFrom,
          validTill: this.qrRequest.qrValidTill,
          usedDate: null,
          isUsed: false
        })
      };
    });

    Swal.fire('Success', `${total} QR code(s) generated`, 'success');
  }

  onSubmit(): void {
    const firstQr = this.generatedQrList.length > 0 ? this.generatedQrList[0] : null;

    this.qrForm.patchValue({
      companyId: this.qrRequest.companyId,
      companyName: this.qrRequest.companyName,
      companyEmail: this.qrRequest.companyEmail,
      requestId: this.qrRequest.requestId,
      noofQR: this.qrRequest.noofQR || this.qrRequest.TotalQty,
      qrValidFrom: this.qrRequest.qrValidFrom,
      qrValidTill: this.qrRequest.qrValidTill,
      serialNo: firstQr?.serialNo || null,
      uniqueCode: firstQr?.uniqueCode || '',
      isUsed: firstQr?.isUsed ?? false,
      usedDate: firstQr?.usedDate || null
    });

    if (this.qrForm.invalid) {
      this.qrForm.markAllAsTouched();
      Swal.fire('Validation', 'Please fill all required fields', 'warning');
      return;
    }

    if (!this.generatedQrList || this.generatedQrList.length === 0) {
      Swal.fire('Validation', 'Please generate QR before saving', 'warning');
      return;
    }

    const formValue = this.qrForm.value;
    const now = new Date().toISOString();
    const totalQty = Number(formValue.noofQR || formValue.TotalQty || 0);

    if (!totalQty || totalQty <= 0) {
      Swal.fire('Validation', 'Invalid QR quantity', 'warning');
      return;
    }

    const qrImages: QrImage[] = this.generatedQrList.map((qr: GeneratedQrItem) => ({
      id: 0,
      qrcoderequestid: 0,
      qrCodeImageBase64: qr.imageBase64 || this.qrImageBase64Only,
      qrCodeText: qr.qrText || '',
      serialNo: qr.serialNo,
      uniqueCode: qr.uniqueCode,
      isUsed: qr.isUsed ?? false,
      usedDate: qr.usedDate || null,
      isActive: true,
      createdDate: now,
      createdBy: String(formValue.createdBy || 1),
      updatedBy: String(formValue.updatedBy || 1),
      updatedDate: now
    }));

    const model: SaveQrCodeRequestModel = {
      id: Number(formValue.id || 0),
      companyId: Number(formValue.companyId || 0),
      companyName: formValue.companyName || '',
      companyEmail: formValue.companyEmail || '',
      requestId: Number(formValue.requestId || 0),
      noofQR: totalQty,
      TotalQty: totalQty,
      qrValidFrom: formValue.qrValidFrom,
      qrValidTill: formValue.qrValidTill,
      isActive: formValue.isActive ?? true,
      createdDate: now,
      updatedDate: now,
      createdBy: Number(formValue.createdBy || 1),
      updatedBy: Number(formValue.updatedBy || 1),
      qrImageBase64: this.qrImageBase64Only,
      qrImages
    };

    console.log('Final save payload:', model);

    this.scannersettingsService.addOrUpdateQr(model).subscribe({
      next: (res: any) => {
        console.log('Saved QR Request:', res);
        Swal.fire('Success', `${totalQty} QR rows saved successfully`, 'success');
      },
      error: (err: any) => {
        console.error('Error saving QR request:', err);
        console.error('Backend error response:', err?.error);
        Swal.fire('Error', err?.error?.message || 'Error saving QR request', 'error');
      }
    });
  }

  getFormValidationErrors(): any {
    const errors: any = {};

    Object.keys(this.qrForm.controls).forEach(key => {
      const control = this.qrForm.get(key);
      if (control && control.invalid) {
        errors[key] = control.errors;
      }
    });

    const qrImagesErrors: any[] = [];

    this.qrImages.controls.forEach((ctrl, index) => {
      if (ctrl.invalid) {
        const groupErrors: any = {};

        Object.keys((ctrl as FormGroup).controls).forEach(k => {
          const child = ctrl.get(k);
          if (child && child.invalid) {
            groupErrors[k] = child.errors;
          }
        });

        qrImagesErrors.push({
          index,
          errors: groupErrors,
          value: ctrl.value
        });
      }
    });

    if (qrImagesErrors.length) {
      errors.qrImages = qrImagesErrors;
    }

    return errors;
  }

  saveQrRequest(): void {
    if (!this.isFormValid()) {
      Swal.fire('Validation', 'Please fill all required fields', 'warning');
      return;
    }

    console.log('SAVE PAYLOAD:', this.qrRequest);
    Swal.fire('Success', 'Ready to save', 'success');
  }

  clearForm(): void {
    this.qrRequest = this.getEmptyModel();
    this.generatedQrList = [];
    this.backendQrText = '';
    this.backendQrImage = '';
    this.qrImageBase64Only = '';
    this.backendUniqueCode = '';

    this.qrForm.reset({
      id: 0,
      companyId: 0,
      companyName: '',
      companyEmail: '',
      requestId: '',
      noofQR: 0,
      qrValidFrom: '',
      qrValidTill: '',
      serialNo: null,
      uniqueCode: '',
      isUsed: false,
      usedDate: null,
      isActive: true,
      createdBy: 1,
      updatedBy: 1
    });

    while (this.qrImages.length) {
      this.qrImages.removeAt(0);
    }

    this.addQrImage();
  }

  sendEmail(): void {
  if (!this.generatedQrList || this.generatedQrList.length === 0) {
    Swal.fire('Error', 'Generate QR first', 'warning');
    return;
  }

  if (!this.qrRequest.companyEmail) {
    Swal.fire('Validation', 'Company email is required', 'warning');
    return;
  }

  const qrItems = this.generatedQrList.map((qr: any, index: number) => ({
    uniqueCode: qr.uniqueCode || qr.UniqueCode || '',
    qrText: qr.qrText || qr.QrText || '',
    qrImageBase64: qr.imageBase64 || this.qrImageBase64Only || '',
    serialNo: qr.serialNo || qr.SerialNo || index + 1,
    isUsed: qr.isUsed ?? qr.IsUsed ?? false,
    usedDate: qr.usedDate || qr.UsedDate || null
  }));

  const payload = {
    email: this.qrRequest.companyEmail,
    qrItems: qrItems
  };

  console.log('Send all QR email payload:', payload);

  this.scannersettingsService.sendQrEmail(payload).subscribe({
    next: () => {
      Swal.fire('Success', 'All QR codes emailed successfully', 'success');
    },
    error: (err) => {
      console.error('Email error:', err);
      Swal.fire('Error', err?.error?.message || 'Failed to send email', 'error');
    }
  });
}


async downloadAllQrs(): Promise<void> {
  if (!this.generatedQrList || this.generatedQrList.length === 0) {
    Swal.fire('Warning', 'No QR images available', 'warning');
    return;
  }

  try {
    const zip = new JSZip();

    this.generatedQrList.forEach((qr: any, index: number) => {
      const base64 = qr.imageBase64 || qr.qrCodeImageBase64 || '';

      if (!base64) return;

      const fileName = `${qr.uniqueCode || 'qr-' + (index + 1)}.png`;
      zip.file(fileName, base64, { base64: true });
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const requestNo = this.qrRequest.requestId || 'QR';
    saveAs(zipBlob, `CSPL-QRCodes-${requestNo}.zip`);
  } catch (error) {
    console.error('ZIP download error:', error);
    Swal.fire('Error', 'Failed to download ZIP file', 'error');
  }
}
}