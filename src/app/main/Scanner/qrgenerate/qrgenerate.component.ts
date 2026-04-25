import { Component, AfterViewInit, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ScannerService } from '../scannerservice';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

export interface RequestDropdownItem {
  requestId: number;
  overrideId: number | null;
  requestNo?: string;
  companyId: number;
  companyName: string;
  companyEmail?: string;
  qty: number;
  fromDate: string;
  tillDate: string;
  sourceType?: string;
  planType?: string;
  displayText?: string;
}

export interface QrTargetUser {
  id: number;
  username: string;
  email: string;
  planType: string;
}

export interface QrCodeRequestModel {
  id: number;
  companyId: number;
  companyName: string;
  companyEmail?: string;
  requestId: number | null;
  overrideId: number | null;
  requestNo?: string;
  noofQR: number;
  TotalQty: number;
  qrValidFrom: string;
  qrValidTill: string;
  planType: string;
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
  overrideId: number | null;
  requestNo: string;
  noofQR: number;
  TotalQty: number;
  qrValidFrom: string;
  qrValidTill: string;
  planType: string;
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
  requestId: number | null;
  overrideId: number | null;
  qrValidFrom: string;
  qrValidTill: string;
  planType: string;
}

@Component({
  selector: 'app-qrgenerate',
  templateUrl: './qrgenerate.component.html',
  styleUrls: ['./qrgenerate.component.scss']
})
export class QRgenerateComponent implements OnInit, AfterViewInit {
  qrForm!: FormGroup;

  requestList: RequestDropdownItem[] = [];
  selectedRequestItem: RequestDropdownItem | null = null;

  targetUsers: QrTargetUser[] = [];
  targetUserEmailsText = '';
  targetUsersLoading = false;

  generatedQrList: GeneratedQrItem[] = [];
  qrImagesdownload: any[] = [];

  backendQrText = '';
  backendQrImage = '';
  qrImageBase64Only = '';
  backendUniqueCode = '';
  isProcessing = false;

  qrRequest: QrCodeRequestModel = this.getEmptyModel();

  constructor(
    private fb: FormBuilder,
    private scannersettingsService: ScannerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadRequestDropdown();
    this.addQrImage();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  get qrImages(): FormArray {
    return this.qrForm.get('qrImages') as FormArray;
  }

  private initializeForm(): void {
    this.qrForm = this.fb.group({
      id: [0],
      companyId: [0, Validators.required],
      companyName: ['', Validators.required],
      companyEmail: [''],
      requestId: [null, Validators.required],
      overrideId: [0],
      requestNo: [''],
      noofQR: [0, Validators.required],
      qrValidFrom: ['', Validators.required],
      qrValidTill: ['', Validators.required],
      planType: ['', Validators.required],
      serialNo: [null],
      uniqueCode: [''],
      isUsed: [false],
      usedDate: [null],
      isActive: [true],
      createdBy: [1],
      updatedBy: [1],
      qrImages: this.fb.array([])
    });
  }

  private getEmptyModel(): QrCodeRequestModel {
    const now = new Date().toISOString();

    return {
      id: 0,
      companyId: 0,
      companyName: '',
      companyEmail: '',
      requestId: null,
      overrideId: null,
      requestNo: '',
      noofQR: 0,
      TotalQty: 0,
      qrValidFrom: '',
      qrValidTill: '',
      planType: '',
      isActive: true,
      createdDate: now,
      updatedDate: now,
      createdBy: 1,
      updatedBy: 1
    };
  }

  private createQrImageGroup(): FormGroup {
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

  loadRequestDropdown(): void {
    this.scannersettingsService.getRequestDropdown().subscribe({
      next: (res: any) => {
        this.requestList = (res?.data || res || []) as RequestDropdownItem[];
        this.selectedRequestItem = null;
        this.qrRequest = this.getEmptyModel();
        this.targetUsers = [];
        this.targetUserEmailsText = '';
        this.targetUsersLoading = false;

        this.qrForm.patchValue({
          requestId: null,
          overrideId: null,
          companyId: 0,
          companyName: '',
          companyEmail: '',
          requestNo: '',
          noofQR: 0,
          qrValidFrom: '',
          qrValidTill: '',
          planType: ''
        });
      },
      error: () => {
        Swal.fire('Error', 'Failed to load request dropdown', 'error');
      }
    });
  }

  onRequestChange(): void {
    this.targetUsers = [];
    this.targetUserEmailsText = '';
    this.targetUsersLoading = false;

    if (!this.selectedRequestItem) {
      this.qrRequest = this.getEmptyModel();

      this.qrForm.patchValue({
        requestId: null,
        overrideId: null,
        companyId: 0,
        companyName: '',
        companyEmail: '',
        requestNo: '',
        noofQR: 0,
        qrValidFrom: '',
        qrValidTill: '',
        planType: ''
      });

      return;
    }

    const selected = this.selectedRequestItem;

    this.qrRequest.requestId = Number(selected.requestId || 0);
    this.qrRequest.overrideId =
      selected.overrideId && Number(selected.overrideId) > 0
        ? Number(selected.overrideId)
        : null;

    this.qrRequest.companyId = Number(selected.companyId || 0);
    this.qrRequest.companyName = selected.companyName || '';
    this.qrRequest.companyEmail = selected.companyEmail || '';
    this.qrRequest.requestNo = selected.requestNo || '';
    this.qrRequest.TotalQty = Number(selected.qty || 0);
    this.qrRequest.noofQR = Number(selected.qty || 0);
    this.qrRequest.qrValidFrom = selected.fromDate || '';
    this.qrRequest.qrValidTill = selected.tillDate || '';
    this.qrRequest.planType = selected.planType || '';

    this.qrForm.patchValue({
      requestId: this.qrRequest.requestId,
      overrideId: this.qrRequest.overrideId,
      companyId: this.qrRequest.companyId,
      companyName: this.qrRequest.companyName,
      companyEmail: this.qrRequest.companyEmail,
      requestNo: this.qrRequest.requestNo,
      noofQR: this.qrRequest.noofQR,
      qrValidFrom: this.qrRequest.qrValidFrom,
      qrValidTill: this.qrRequest.qrValidTill,
      planType: this.qrRequest.planType
    });

    this.loadTargetUsers();
  }

  loadTargetUsers(): void {
    this.targetUsers = [];
    this.targetUserEmailsText = '';

    const companyId = Number(this.qrRequest.companyId || 0);
    const planType = String(this.qrRequest.planType || '').trim();
    const count = Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0);

    if (companyId <= 0 || !planType || count <= 0) {
      return;
    }

    this.targetUsersLoading = true;

    this.scannersettingsService.getQrTargetUsers(companyId, planType, count).subscribe({
      next: (res: any) => {
        const list = (res?.data || res || []) as QrTargetUser[];
        this.targetUsers = list;
        this.targetUserEmailsText = list.map(x => x.email).join(', ');
        this.targetUsersLoading = false;
      },
      error: () => {
        this.targetUsers = [];
        this.targetUserEmailsText = '';
        this.targetUsersLoading = false;
        Swal.fire('Error', 'Failed to load target user emails', 'error');
      }
    });
  }

  private isFormValid(): boolean {
    const companyId = Number(this.qrRequest.companyId || 0);
    const requestId = Number(this.qrRequest.requestId || 0);
    const companyName = String(this.qrRequest.companyName || '').trim();
    const noofQR = Number(this.qrRequest.noofQR ?? this.qrRequest.TotalQty ?? 0);
    const qrValidFrom = this.qrRequest.qrValidFrom;
    const qrValidTill = this.qrRequest.qrValidTill;
    const planType = String(this.qrRequest.planType || '').trim();

    return (
      companyId > 0 &&
      requestId > 0 &&
      companyName.length > 0 &&
      noofQR > 0 &&
      !!qrValidFrom &&
      !!qrValidTill &&
      !!planType
    );
  }

  private toIsoDate(value: any): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date.toISOString();
  }

  private normalizeOverrideId(value: any): number | null {
    if (value === null || value === undefined || value === '' || Number(value) <= 0) {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private syncFormFromRequest(firstQr: GeneratedQrItem | null): void {
    this.qrForm.patchValue({
      id: this.qrRequest.id || 0,
      companyId: Number(this.qrRequest.companyId || 0),
      companyName: this.qrRequest.companyName || '',
      companyEmail: this.qrRequest.companyEmail || '',
      requestId: this.qrRequest.requestId ?? null,
      overrideId: this.qrRequest.overrideId ?? null,
      requestNo: this.qrRequest.requestNo || '',
      noofQR: Number(this.qrRequest.noofQR ?? this.qrRequest.TotalQty ?? 0),
      qrValidFrom: this.qrRequest.qrValidFrom || '',
      qrValidTill: this.qrRequest.qrValidTill || '',
      planType: this.qrRequest.planType || '',
      serialNo: firstQr?.serialNo ?? null,
      uniqueCode: firstQr?.uniqueCode ?? '',
      isUsed: firstQr?.isUsed ?? false,
      usedDate: firstQr?.usedDate ?? null,
      isActive: this.qrRequest.isActive ?? true,
      createdBy: this.qrRequest.createdBy || 1,
      updatedBy: this.qrRequest.updatedBy || 1
    });
  }

  submitForApproval(): void {
    if (this.isProcessing) {
      return;
    }

    if (!this.selectedRequestItem) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select a pending segment',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!this.isFormValid()) {
      Swal.fire({
        title: 'Warning',
        text: 'Please fill all required fields',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const from = new Date(this.qrRequest.qrValidFrom);
    const till = new Date(this.qrRequest.qrValidTill);

    if (!isNaN(from.getTime()) && !isNaN(till.getTime()) && till < from) {
      Swal.fire({
        title: 'Warning',
        text: 'Valid Till must be greater than or equal to Valid From',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const requiredCount = Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0);

    if (this.targetUsers.length < requiredCount) {
      Swal.fire({
        title: 'Warning',
        text: `Only ${this.targetUsers.length} ${this.qrRequest.planType} user email(s) available, but ${requiredCount} QR code(s) required.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const userId = Number(localStorage.getItem('userId') || 1);

    const payload = {
      ...this.qrRequest,
      id: 0,
      requestId: Number(this.qrRequest.requestId || 0),
      overrideId: this.normalizeOverrideId(this.qrRequest.overrideId),
      noofQR: requiredCount,
      totalQty: requiredCount,
      planType: this.qrRequest.planType || '',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId
    };

    this.isProcessing = true;

    this.scannersettingsService.submitQrApproval(payload).subscribe({
      next: (res: any) => {
        this.isProcessing = false;

        const isSuccess = res?.isSuccess === true;
        const message = res?.message || 'QR request submitted for approval successfully.';
        const messageType = res?.messageType || (isSuccess ? 'success' : 'warning');
        const data = res?.data;

        if (isSuccess) {
          Swal.fire({
            title: 'Success',
            text: message,
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            allowOutsideClick: false
          }).then(() => {
            this.router.navigate(['/scanner/listqr']);
          });
          return;
        }

        Swal.fire({
          title: messageType === 'error' ? 'Error' : 'Warning',
          text: message,
          icon: messageType === 'error' ? 'error' : 'warning',
          confirmButtonText: 'OK',
          allowOutsideClick: false
        }).then(() => {
          if (data?.companyId) {
            this.router.navigate(['/users/list'], {
              queryParams: { companyId: data.companyId }
            });
          }
        });
      },
      error: (err: any) => {
        this.isProcessing = false;

        const errorObj = err?.error || {};
        const message =
          errorObj?.message ||
          errorObj?.Message ||
          'Failed to submit approval request';

        const data = errorObj?.data || errorObj?.Data;
        const messageType = errorObj?.messageType || errorObj?.MessageType || 'error';

        Swal.fire({
          title: messageType === 'warning' ? 'Warning' : 'Error',
          text: message,
          icon: messageType === 'warning' ? 'warning' : 'error',
          confirmButtonText: 'OK',
          allowOutsideClick: false
        }).then(() => {
          if (data?.companyId) {
            this.router.navigate(['/users/list'], {
              queryParams: { companyId: data.companyId }
            });
          }
        });
      }
    });
  }

  onSubmit(): Observable<any> {
    const firstQr = this.generatedQrList?.length ? this.generatedQrList[0] : null;
    this.syncFormFromRequest(firstQr);

    if (this.qrForm.invalid) {
      this.qrForm.markAllAsTouched();
      Swal.fire('Missing Information', 'Please fill all required fields', 'warning');
      return throwError(() => new Error('Form is invalid'));
    }

    if (!this.generatedQrList || this.generatedQrList.length === 0) {
      Swal.fire('Validation', 'Please generate QR before saving', 'warning');
      return throwError(() => new Error('Please generate QR before saving'));
    }

    const formValue = this.qrForm.getRawValue();
    const now = new Date().toISOString();

    const totalQty = Number(formValue.noofQR || this.qrRequest.TotalQty || 0);
    if (totalQty <= 0) {
      Swal.fire('Warning', 'Invalid QR quantity', 'warning');
      return throwError(() => new Error('Invalid QR quantity'));
    }

    const fromDate = formValue.qrValidFrom;
    const tillDate = formValue.qrValidTill;

    if (!fromDate || !tillDate) {
      Swal.fire('Warning', 'QR valid dates are invalid', 'warning');
      return throwError(() => new Error('QR valid dates are invalid'));
    }

    if (new Date(fromDate).getTime() > new Date(tillDate).getTime()) {
      Swal.fire('Warning', 'QR Valid Till must be greater than or equal to QR Valid From', 'warning');
      return throwError(() => new Error('QR valid date range is invalid'));
    }

    const createdBy = Number(formValue.createdBy || this.qrRequest.createdBy || 1);
    const updatedBy = Number(formValue.updatedBy || this.qrRequest.updatedBy || 1);
    const createdDate = this.qrRequest.createdDate || now;
    const normalizedOverrideId = this.normalizeOverrideId(formValue.overrideId);

    const qrImages: QrImage[] = this.generatedQrList.map(
      (qr: GeneratedQrItem, index: number) => ({
        id: 0,
        qrcoderequestid: 0,
        qrCodeImageBase64: qr.imageBase64 || this.qrImageBase64Only || '',
        qrCodeText: qr.qrText || '',
        serialNo: Number(qr.serialNo ?? index + 1),
        uniqueCode: qr.uniqueCode || '',
        isUsed: qr.isUsed ?? false,
        usedDate: qr.usedDate ? this.toIsoDate(qr.usedDate) : null,
        isActive: true,
        createdDate: now,
        createdBy: String(createdBy),
        updatedDate: now,
        updatedBy: String(updatedBy)
      })
    );

    const model: SaveQrCodeRequestModel = {
      id: Number(formValue.id || 0),
      companyId: Number(formValue.companyId || 0),
      companyName: formValue.companyName || '',
      companyEmail: formValue.companyEmail || '',
      requestId: Number(formValue.requestId || 0),
      overrideId: normalizedOverrideId,
      requestNo: this.qrRequest.requestNo || '',
      noofQR: totalQty,
      TotalQty: totalQty,
      qrValidFrom: fromDate,
      qrValidTill: tillDate,
      planType: this.qrRequest.planType || '',
      isActive: formValue.isActive ?? true,
      createdDate: createdDate,
      updatedDate: now,
      createdBy: createdBy,
      updatedBy: updatedBy,
      qrImageBase64: this.qrImageBase64Only || firstQr?.imageBase64 || '',
      qrImages: qrImages
    };

    return this.scannersettingsService.addOrUpdateQr(model);
  }

  sendEmail(): Observable<any> {
    const emailPayload = {
      email: this.qrRequest.companyEmail,
      companyName: this.qrRequest.companyName,
      requestId: this.qrRequest.requestId,
      planType: this.qrRequest.planType,
      qrItems: this.generatedQrList.map((qr: GeneratedQrItem) => ({
        uniqueCode: qr.uniqueCode || '',
        qrText: qr.qrText || '',
        qrImageBase64: qr.imageBase64 || ''
      }))
    };

    return this.scannersettingsService.sendQrEmail(emailPayload);
  }

  async downloadAllQrs(): Promise<void> {
    if (!this.generatedQrList || this.generatedQrList.length === 0) {
      Swal.fire('Warning', 'No QR images available', 'warning');
      return;
    }

    try {
      const zip = new JSZip();

      this.generatedQrList.forEach((qr: GeneratedQrItem, index: number) => {
        const base64 = qr.imageBase64 || '';
        if (!base64) return;

        const fileName = `${qr.uniqueCode || 'qr-' + (index + 1)}.png`;
        zip.file(fileName, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const requestNo = this.qrRequest.requestId || 'QR';
      saveAs(zipBlob, `CSPL-QRCodes-${requestNo}.zip`);
    } catch {
      Swal.fire('Error', 'Failed to download ZIP file', 'error');
    }
  }

  clearForm(): void {
    this.selectedRequestItem = null;
    this.qrRequest = this.getEmptyModel();
    this.targetUsers = [];
    this.targetUserEmailsText = '';
    this.targetUsersLoading = false;

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
      requestId: null,
      overrideId: 0,
      requestNo: '',
      noofQR: 0,
      qrValidFrom: '',
      qrValidTill: '',
      planType: '',
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
}