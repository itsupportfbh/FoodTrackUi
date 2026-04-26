import { Component, AfterViewInit, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ScannerService } from '../scannerservice';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

export interface CuisineDropdownItem {
  cuisineId: number;
  cuisineName: string;
  qty: number;
}

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

  cuisineId?: number;
  cuisineName?: string;
  cuisines?: CuisineDropdownItem[];

  displayText?: string;
}

export interface QrTargetUser {
  id: number;
  username: string;
  email: string;
  planType: string;
  cuisineId?: number;
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
  cuisineId: number;
  cuisineName?: string;
  cuisines?: CuisineDropdownItem[];
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
  cuisineId: number;
  cuisineName?: string;
  cuisines?: CuisineDropdownItem[];
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
  cuisineId?: number;
  cuisineName?: string;
}

@Component({
  selector: 'app-qrgenerate',
  templateUrl: './qrgenerate.component.html',
  styleUrls: ['./qrgenerate.component.scss'],
  encapsulation:ViewEncapsulation.None
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
      companyId: [0],
      companyName: [''],
      companyEmail: [''],
      requestId: [null],
      overrideId: [null],
      requestNo: [''],
      noofQR: [0],
      qrValidFrom: [''],
      qrValidTill: [''],
      planType: [''],
      cuisineId: [0],
      cuisineName: [''],
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
      cuisineId: 0,
      cuisineName: '',
      cuisines: [],
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

  private getValue(obj: any, keys: string[]): any {
    if (!obj) return null;

    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }

    return null;
  }

  private normalizeOverrideId(value: any): number | null {
    if (value === null || value === undefined || value === '' || Number(value) <= 0) {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private normalizeCuisines(item: any): CuisineDropdownItem[] {
    const raw = this.getValue(item, ['cuisines', 'Cuisines']);

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((x: any) => ({
        cuisineId: Number(this.getValue(x, ['cuisineId', 'CuisineId', 'cuisineID', 'CuisineID']) || 0),
        cuisineName: this.getValue(x, ['cuisineName', 'CuisineName']) || '',
        qty: Number(this.getValue(x, ['qty', 'Qty']) || 0)
      })).filter(x => x.cuisineId > 0);
    }

    const cuisineId = Number(this.getValue(item, ['cuisineId', 'CuisineId', 'cuisineID', 'CuisineID']) || 0);
    const cuisineName = this.getValue(item, ['cuisineName', 'CuisineName']) || '';

    if (cuisineId > 0) {
      return [{
        cuisineId,
        cuisineName,
        qty: Number(this.getValue(item, ['qty', 'Qty', 'totalQty', 'TotalQty']) || 0)
      }];
    }

    return [];
  }

  loadRequestDropdown(): void {
    this.scannersettingsService.getRequestDropdown().subscribe({
      next: (res: any) => {
        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        this.requestList = rawList.map((x: any) => {
          const cuisines = this.normalizeCuisines(x);
          const firstCuisine = cuisines.length > 0 ? cuisines[0] : null;

          return {
            ...x,
            requestId: Number(this.getValue(x, ['requestId', 'RequestId']) || 0),
            overrideId: this.normalizeOverrideId(this.getValue(x, ['overrideId', 'OverrideId'])),
            requestNo: this.getValue(x, ['requestNo', 'RequestNo']) || '',
            companyId: Number(this.getValue(x, ['companyId', 'CompanyId']) || 0),
            companyName: this.getValue(x, ['companyName', 'CompanyName']) || '',
            companyEmail: this.getValue(x, ['companyEmail', 'CompanyEmail']) || '',
            qty: Number(this.getValue(x, ['qty', 'Qty', 'totalQty', 'TotalQty']) || 0),
            fromDate: this.getValue(x, ['fromDate', 'FromDate']) || '',
            tillDate: this.getValue(x, ['tillDate', 'TillDate', 'toDate', 'ToDate']) || '',
            sourceType: this.getValue(x, ['sourceType', 'SourceType']) || '',
            planType: this.getValue(x, ['planType', 'PlanType']) || '',
            cuisineId: Number(
              this.getValue(x, ['cuisineId', 'CuisineId', 'cuisineID', 'CuisineID']) ||
              firstCuisine?.cuisineId ||
              0
            ),
            cuisineName:
              this.getValue(x, ['cuisineName', 'CuisineName']) ||
              firstCuisine?.cuisineName ||
              '',
            cuisines,
            displayText: this.getValue(x, ['displayText', 'DisplayText']) || ''
          };
        });

        this.clearSelectedOnly();
      },
      error: () => {
        Swal.fire('Error', 'Failed to load request dropdown', 'error');
      }
    });
  }

  private clearSelectedOnly(): void {
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
      planType: '',
      cuisineId: 0,
      cuisineName: ''
    });
  }

  onRequestChange(): void {
    this.targetUsers = [];
    this.targetUserEmailsText = '';
    this.targetUsersLoading = false;

    if (!this.selectedRequestItem) {
      this.clearSelectedOnly();
      return;
    }

    const selected: any = this.selectedRequestItem;
    const cuisines = this.normalizeCuisines(selected);
    const firstCuisine = cuisines.length > 0 ? cuisines[0] : null;

    this.qrRequest.requestId = Number(this.getValue(selected, ['requestId', 'RequestId']) || 0);
    this.qrRequest.overrideId = this.normalizeOverrideId(this.getValue(selected, ['overrideId', 'OverrideId']));
    this.qrRequest.companyId = Number(this.getValue(selected, ['companyId', 'CompanyId']) || 0);
    this.qrRequest.companyName = this.getValue(selected, ['companyName', 'CompanyName']) || '';
    this.qrRequest.companyEmail = this.getValue(selected, ['companyEmail', 'CompanyEmail']) || '';
    this.qrRequest.requestNo = this.getValue(selected, ['requestNo', 'RequestNo']) || '';
    this.qrRequest.TotalQty = Number(this.getValue(selected, ['qty', 'Qty', 'totalQty', 'TotalQty']) || 0);
    this.qrRequest.noofQR = Number(this.getValue(selected, ['qty', 'Qty', 'totalQty', 'TotalQty']) || 0);
    this.qrRequest.qrValidFrom = this.getValue(selected, ['fromDate', 'FromDate']) || '';
    this.qrRequest.qrValidTill = this.getValue(selected, ['tillDate', 'TillDate', 'toDate', 'ToDate']) || '';
    this.qrRequest.planType = this.getValue(selected, ['planType', 'PlanType']) || '';

    this.qrRequest.cuisineId = Number(
      this.getValue(selected, ['cuisineId', 'CuisineId', 'cuisineID', 'CuisineID']) ||
      firstCuisine?.cuisineId ||
      0
    );

    this.qrRequest.cuisineName =
      this.getValue(selected, ['cuisineName', 'CuisineName']) ||
      firstCuisine?.cuisineName ||
      '';

    this.qrRequest.cuisines = cuisines;

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
      planType: this.qrRequest.planType,
      cuisineId: this.qrRequest.cuisineId,
      cuisineName: this.qrRequest.cuisineName
    });

    console.log('Selected pending item:', selected);
    console.log('Selected cuisines:', cuisines);
    console.log('QR request mapped:', this.qrRequest);

    this.loadTargetUsers();
  }

loadTargetUsers(): void {
  this.targetUsers = [];
  this.targetUserEmailsText = '';

  const companyId = Number(this.qrRequest.companyId || 0);
  const planType = String(this.qrRequest.planType || '').trim();
  const count = Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0);

  const cuisineIds = (this.qrRequest.cuisines || [])
    .map(x => Number(x.cuisineId || 0))
    .filter(x => x > 0);

  if (companyId <= 0 || !planType || cuisineIds.length === 0 || count <= 0) {
    return;
  }

  this.targetUsersLoading = true;

  this.scannersettingsService
    .getQrTargetUsers(companyId, planType, cuisineIds, count)
    .subscribe({
      next: (res: any) => {
        const list =
          Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.data?.users) ? res.data.users :
          Array.isArray(res?.users) ? res.users :
          [];

        this.targetUsers = list;
        this.targetUserEmailsText = list.map((x: any) => x.email).join(', ');
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
    const noofQR = Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0);
    const qrValidFrom = String(this.qrRequest.qrValidFrom || '').trim();
    const qrValidTill = String(this.qrRequest.qrValidTill || '').trim();
    const planType = String(this.qrRequest.planType || '').trim();
    const cuisineId = Number(this.qrRequest.cuisineId || 0);

    if (companyId <= 0) return false;
    if (requestId <= 0) return false;
    if (!companyName) return false;
    if (noofQR <= 0) return false;
    if (!qrValidFrom) return false;
    if (!qrValidTill) return false;
    if (!planType) return false;
    if (cuisineId <= 0) return false;

    return true;
  }

  private getInvalidMessage(): string {
    if (Number(this.qrRequest.companyId || 0) <= 0) return 'Company is missing.';
    if (Number(this.qrRequest.requestId || 0) <= 0) return 'Request is missing.';
    if (!String(this.qrRequest.companyName || '').trim()) return 'Company name is missing.';
    if (Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0) <= 0) return 'QR quantity is missing.';
    if (!String(this.qrRequest.qrValidFrom || '').trim()) return 'QR Valid From is missing.';
    if (!String(this.qrRequest.qrValidTill || '').trim()) return 'QR Valid Till is missing.';
    if (!String(this.qrRequest.planType || '').trim()) return 'Plan type is missing.';

    if (Number(this.qrRequest.cuisineId || 0) <= 0) {
      return 'Cuisine is missing in pending dropdown. Please add CuisineId in GetRequestIdDropdown API response.';
    }

    return 'Please fill all required fields.';
  }

  private toIsoDate(value: any): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date.toISOString();
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
      noofQR: Number(this.qrRequest.noofQR || this.qrRequest.TotalQty || 0),
      qrValidFrom: this.qrRequest.qrValidFrom || '',
      qrValidTill: this.qrRequest.qrValidTill || '',
      planType: this.qrRequest.planType || '',
      cuisineId: Number(this.qrRequest.cuisineId || 0),
      cuisineName: this.qrRequest.cuisineName || '',
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
  if (this.isProcessing) return;
 
  if (!this.selectedRequestItem) {
    Swal.fire('Warning', 'Please select a pending segment.', 'warning');
    return;
  }
 
  if (!this.isFormValid()) {
    console.log('Form invalid values:', this.qrRequest);
    Swal.fire('Warning', this.getInvalidMessage(), 'warning');
    return;
  }
 
  const from = new Date(this.qrRequest.qrValidFrom);
  const till = new Date(this.qrRequest.qrValidTill);
 
  if (!isNaN(from.getTime()) && !isNaN(till.getTime()) && till < from) {
    Swal.fire('Warning', 'Valid Till must be greater than or equal to Valid From.', 'warning');
    return;
  }
 
 const requiredCount = Number(
  this.qrRequest.noofQR ||
  this.qrRequest.TotalQty ||
  0
);
 
  if (requiredCount <= 0) {
    Swal.fire('Warning', 'Pending QR Qty should be greater than 0.', 'warning');
    return;
  }
 
  const userId = Number(localStorage.getItem('userId') || 1);
 
  const payload = {
    ...this.qrRequest,
 
    id: 0,
    requestId: Number(this.qrRequest.requestId || 0),
    companyId: Number(this.qrRequest.companyId || 0),
    overrideId: this.normalizeOverrideId(this.qrRequest.overrideId),
 
    noofQR: requiredCount,
    totalQty: requiredCount,
 
    planType: this.qrRequest.planType || '',
    cuisineId: Number(this.qrRequest.cuisineId || 0),
    cuisineName: this.qrRequest.cuisineName || '',
    cuisines: this.qrRequest.cuisines || this.selectedRequestItem?.cuisines || [],
 
    qrValidFrom: this.qrRequest.qrValidFrom,
    qrValidTill: this.qrRequest.qrValidTill,
 
    isActive: true,
    approvalStatus: 0,
 
    createdBy: userId,
    updatedBy: userId,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  };
 
  console.log('Submit approval payload:', payload);
 
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
          this.router.navigate(['/users/users-list'], {
            queryParams: {
              companyId: data.companyId,
              planType: data.planType || this.qrRequest.planType || ''
            }
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
        'Failed to submit approval request.';
 
      const data = errorObj?.data || errorObj?.Data;
      const messageType =
        errorObj?.messageType ||
        errorObj?.MessageType ||
        'error';
 
      Swal.fire({
        title: messageType === 'warning' ? 'Warning' : 'Error',
        text: message,
        icon: messageType === 'warning' ? 'warning' : 'error',
        confirmButtonText: 'OK',
        allowOutsideClick: false
      }).then(() => {
        if (data?.companyId) {
          this.router.navigate(['/users/users-list'], {
            queryParams: {
              companyId: data.companyId,
              planType: data.planType || this.qrRequest.planType || ''
            }
          });
        }
      });
    }
  });
}

  onSubmit(): Observable<any> {
    const firstQr = this.generatedQrList?.length ? this.generatedQrList[0] : null;
    this.syncFormFromRequest(firstQr);

    if (!this.isFormValid()) {
      Swal.fire('Missing Information', this.getInvalidMessage(), 'warning');
      return throwError(() => new Error('Form is invalid'));
    }

    if (!this.generatedQrList || this.generatedQrList.length === 0) {
      Swal.fire('Validation', 'Please generate QR before saving.', 'warning');
      return throwError(() => new Error('Please generate QR before saving'));
    }

    const formValue = this.qrForm.getRawValue();
    const now = new Date().toISOString();
    const totalQty = Number(formValue.noofQR || this.qrRequest.TotalQty || 0);
    const fromDate = formValue.qrValidFrom;
    const tillDate = formValue.qrValidTill;

    if (new Date(fromDate).getTime() > new Date(tillDate).getTime()) {
      Swal.fire('Warning', 'QR Valid Till must be greater than or equal to QR Valid From.', 'warning');
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
      cuisineId: Number(this.qrRequest.cuisineId || 0),
      cuisineName: this.qrRequest.cuisineName || '',
      cuisines: this.qrRequest.cuisines || [],
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
      cuisineId: Number(this.qrRequest.cuisineId || 0),
      cuisineName: this.qrRequest.cuisineName || '',
      cuisines: this.qrRequest.cuisines || [],
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
      Swal.fire('Warning', 'No QR images available.', 'warning');
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
      const requestNo = this.qrRequest.requestNo || this.qrRequest.requestId || 'QR';
      saveAs(zipBlob, `CSPL-QRCodes-${requestNo}.zip`);
    } catch {
      Swal.fire('Error', 'Failed to download ZIP file.', 'error');
    }
  }

  clearForm(): void {
    this.clearSelectedOnly();

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
      overrideId: null,
      requestNo: '',
      noofQR: 0,
      qrValidFrom: '',
      qrValidTill: '',
      planType: '',
      cuisineId: 0,
      cuisineName: '',
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