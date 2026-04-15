import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  TemplateRef
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CateringService } from 'app/main/services/catering.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

interface SessionTimingModel {
  sessionId: number;
  fromTime: string;
  toTime: string;
}

@Component({
  selector: 'app-company-sidebar',
  templateUrl: './company-sidebar.component.html',
  styleUrls: ['./company-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompanySidebarComponent implements OnInit, OnChanges {
  @Input() showSidebar = false;
  @Input() editData: any;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('sessionTimingModal') sessionTimingModal!: TemplateRef<any>;

  public companySuggestions: any[] = [];
  public filteredCompanySuggestions: any[] = [];

  public confirmPassword = '';
  private modalRef: NgbModalRef | null = null;

  public model: any = {
    id: null,
    companyCode: '',
    companyName: '',
    contactPerson: '',
    contactNo: '',
    email: '',
    password: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateName: '',
    postalCode: '',
    isActive: true,
    userId: 1,
    locationIds: [],
    sessionIds: [],
    sessionTimings: [] as SessionTimingModel[],
    cuisineIds: []
  };

  public locationList: any[] = [];
  public sessionList: any[] = [];
  public cuisineList: any[] = [];

  constructor(
    private sidebarService: CoreSidebarService,
    private companyService: CateringService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editData']) {
      if (this.editData && this.editData.id) {
        this.model = {
          id: this.editData.id,
          companyCode: this.editData.companyCode || '',
          companyName: this.editData.companyName || '',
          contactPerson: this.editData.contactPerson || '',
          contactNo: this.editData.contactNo || '',
          email: this.editData.email || '',
          password: '',
          addressLine1: this.editData.addressLine1 || '',
          addressLine2: this.editData.addressLine2 || '',
          city: this.editData.city || '',
          stateName: this.editData.stateName || '',
          postalCode: this.editData.postalCode || '',
          isActive: this.editData.isActive ?? true,
          userId: 1,
          locationIds: this.editData.locationIds || [],
          sessionIds:
            this.editData.sessionIds ||
            (this.editData.sessionTimings || []).map((x: any) => Number(x.sessionId)),
          sessionTimings: (this.editData.sessionTimings || []).map((x: any) => ({
            sessionId: Number(x.sessionId),
            fromTime: this.normalizeTime(x.fromTime ?? x.FromTime),
            toTime: this.normalizeTime(x.toTime ?? x.ToTime)
          })),
          cuisineIds: this.editData.cuisineIds || []
        };
      } else {
        this.resetForm();
      }

      this.confirmPassword = '';
    }
  }

  loadDropdowns(): void {
    this.companyService.getLocation().subscribe({
      next: (res: any) => {
        this.locationList = res?.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load locations', err);
        this.locationList = [];
      }
    });

    this.companyService.getSession().subscribe({
      next: (res: any) => {
        this.sessionList = res?.data || res || [];

        // edit mode / already selected sessions irundha timing sync pannum
        if (this.model?.sessionIds?.length) {
          this.onSessionChange();
        }
      },
      error: (err) => {
        console.error('Failed to load sessions', err);
        this.sessionList = [];
      }
    });

    this.companyService.getAllCuisine().subscribe({
      next: (res: any) => {
        this.cuisineList = res?.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load cuisines', err);
        this.cuisineList = [];
      }
    });

    this.companyService.getCompanies().subscribe({
      next: (res: any) => {
        this.companySuggestions = (res?.data || res || []).map((x: any) => ({
          ...x,
          companyName: x.companyName || x.name || ''
        }));
        this.filteredCompanySuggestions = [...this.companySuggestions];
      },
      error: (err) => {
        console.error('Failed to load companies', err);
        this.companySuggestions = [];
        this.filteredCompanySuggestions = [];
      }
    });
  }

  onCompanyNameInput(): void {
    const searchText = (this.model.companyName || '').trim().toLowerCase();

    if (!searchText) {
      this.filteredCompanySuggestions = [...this.companySuggestions];
      return;
    }

    this.filteredCompanySuggestions = this.companySuggestions.filter((x: any) =>
      (x.companyName || '').toLowerCase().includes(searchText)
    );
  }

  onSessionChange(): void {
    const selectedSessions: number[] = (this.model.sessionIds || []).map((x: any) => Number(x));
    const existingTimings: SessionTimingModel[] = this.model.sessionTimings || [];

    this.model.sessionTimings = selectedSessions.map((sessionId: number) => {
      const existing = existingTimings.find((t: any) => Number(t.sessionId) === sessionId);

      if (existing) {
        return {
          sessionId,
          fromTime: this.normalizeTime(existing.fromTime),
          toTime: this.normalizeTime(existing.toTime)
        };
      }

      const sessionMaster = this.sessionList.find(
        (s: any) => Number(s.id ?? s.Id) === sessionId
      );

      return {
        sessionId,
        fromTime: this.normalizeTime(sessionMaster?.fromTime ?? sessionMaster?.FromTime),
        toTime: this.normalizeTime(sessionMaster?.toTime ?? sessionMaster?.ToTime)
      };
    });
  }

  getSessionName(sessionId: number): string {
    const session = this.sessionList.find(
      (s: any) => Number(s.id ?? s.Id) === Number(sessionId)
    );

    return session ? (session.sessionName || session.SessionName || '') : '';
  }

  normalizeTime(value: any): string {
    if (!value) return '';

    const str = String(value).trim();

    // HH:mm
    if (/^\d{2}:\d{2}$/.test(str)) {
      return str;
    }

    // HH:mm:ss
    if (/^\d{2}:\d{2}:\d{2}$/.test(str)) {
      return str.substring(0, 5);
    }

    // HH:mm:ss.sss
    if (/^\d{2}:\d{2}:\d{2}\.\d+$/.test(str)) {
      return str.substring(0, 5);
    }

    return str.length >= 5 ? str.substring(0, 5) : '';
  }

  openSessionTimingModal(): void {
    if (!this.model.sessionIds || this.model.sessionIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Sessions',
        text: 'Please select at least one session first',
        customClass: {
          confirmButton: 'btn btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }

    this.onSessionChange();

    this.sidebarService.getSidebarRegistry('new-company-sidebar')?.close();

    setTimeout(() => {
      this.modalRef = this.modalService.open(this.sessionTimingModal, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        centered: true
      });
    }, 200);
  }

  closeSessionTimingModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }

    setTimeout(() => {
      this.sidebarService.getSidebarRegistry('new-company-sidebar')?.open();
    }, 150);
  }

  saveSessionTimings(): void {
    if (!this.model.sessionTimings || this.model.sessionTimings.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Sessions',
        text: 'Please select session first',
        customClass: {
          confirmButton: 'btn btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }

    for (const timing of this.model.sessionTimings) {
      const sessionName = this.getSessionName(timing.sessionId);

      if (!timing.fromTime || !timing.toTime) {
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Timings',
          text: `Please set From Time and To Time for ${sessionName}`,
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });
        return;
      }

      if (timing.fromTime >= timing.toTime) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Timing',
          text: `${sessionName} To Time must be greater than From Time`,
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });
        return;
      }
    }

    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }

    this.saveCompany();
  }

  submit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    if (this.model.sessionIds && this.model.sessionIds.length > 0) {
      this.onSessionChange();
      this.openSessionTimingModal();
      return;
    }

    this.saveCompany();
  }

  private formatTimeForApi(value: string): string {
    if (!value) return '';
    return value.length === 5 ? `${value}:00` : value;
  }

  private saveCompany(): void {
    const payload = {
      ...this.model,
      sessionTimings: (this.model.sessionTimings || []).map((x: any) => ({
        sessionId: Number(x.sessionId),
        fromTime: this.formatTimeForApi(this.normalizeTime(x.fromTime)),
        toTime: this.formatTimeForApi(this.normalizeTime(x.toTime))
      }))
    };

    this.companyService.saveCompany(payload).subscribe({
      next: () => {
        this.saved.emit();

        Swal.fire({
          icon: 'success',
          title: this.model.id ? 'Updated' : 'Created',
          text: this.model.id
            ? 'Company updated successfully'
            : 'Company created successfully',
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });

        this.closeCompanySidebar();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Save failed',
          text: err?.error?.message || 'Something went wrong',
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  closeCompanySidebar(): void {
    this.showSidebar = false;
    this.resetForm();
    this.closed.emit();
    this.sidebarService.getSidebarRegistry('new-company-sidebar')?.close();
  }

  resetForm(): void {
    this.model = {
      id: null,
      companyCode: '',
      companyName: '',
      contactPerson: '',
      contactNo: '',
      email: '',
      password: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateName: '',
      postalCode: '',
      isActive: true,
      userId: 1,
      locationIds: [],
      sessionIds: [],
      sessionTimings: [],
      cuisineIds: []
    };

    this.confirmPassword = '';
    this.modalRef = null;
    this.filteredCompanySuggestions = [...this.companySuggestions];
  }
}