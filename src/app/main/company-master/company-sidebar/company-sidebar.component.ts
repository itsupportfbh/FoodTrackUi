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

  public companySuggestions: any[] = [];
public filteredCompanySuggestions: any[] = [];
  @ViewChild('sessionTimingModal') sessionTimingModal!: TemplateRef<any>;

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
          sessionIds: this.editData.sessionIds || (this.editData.sessionTimings || []).map((x: any) => x.sessionId),
          sessionTimings: (this.editData.sessionTimings || []).map((x: any) => ({
            sessionId: x.sessionId,
            fromTime: this.normalizeTime(x.fromTime),
            toTime: this.normalizeTime(x.toTime)
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
  this.companyService.getLocation().subscribe(res => {
    this.locationList = res?.data || [];
  });

  this.companyService.getSession().subscribe(res => {
    this.sessionList = res?.data || [];
  });

  this.companyService.getAllCuisine().subscribe((res: any) => {
    this.cuisineList = res || [];
  });

  this.companyService.getCompanies().subscribe((res: any) => {
    this.companySuggestions = (res?.data || []).map((x: any) => ({
      ...x,
      companyName: x.companyName || x.name || ''
    }));
    this.filteredCompanySuggestions = [...this.companySuggestions];
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
    const selectedSessions = this.model.sessionIds || [];
    const existingTimings = this.model.sessionTimings || [];

    this.model.sessionTimings = selectedSessions.map((sessionId: number) => {
      const existing = existingTimings.find((t: any) => t.sessionId === sessionId);
      return existing || {
        sessionId,
        fromTime: '',
        toTime: ''
      };
    });
  }

  getSessionName(sessionId: number): string {
    const session = this.sessionList.find(s => s.id === sessionId);
    return session ? session.sessionName : '';
  }

  normalizeTime(value: any): string {
    if (!value) return '';
    return String(value).substring(0, 5);
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

  // close sidebar visually மட்டும்
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
      sessionId: x.sessionId,
      fromTime: this.formatTimeForApi(x.fromTime),
      toTime: this.formatTimeForApi(x.toTime)
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
  }
  
}