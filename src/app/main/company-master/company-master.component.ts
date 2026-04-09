import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { CateringService } from '../services/catering.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import * as feather from 'feather-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-master',
  templateUrl: './company-master.component.html',
  styleUrls: ['./company-master.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompanyMasterComponent implements OnInit {
  public ColumnMode = ColumnMode;
  public rows: any[] = [];
  public tempRows: any[] = [];
  public selectedOption = 10;
  public searchValue = '';

  public filterCompanyName = '';
  public filterEmail = '';
  public selectedStatus: any = null;

  public showSidebar = false;

  public statusOptions = [
    { name: 'Active', value: true },
    { name: 'Inactive', value: false }
  ];

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
    userId: 1
  };

  public confirmPassword = '';

  constructor(
    private companyService: CateringService,
    private sidebarService: CoreSidebarService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

loadCompanies(): void {
  this.companyService.getCompanies().subscribe({
    next: (res: any) => {
      const data = Array.isArray(res) ? res : (res?.data || []);

      this.rows = [...data];
      this.tempRows = [...data];

      setTimeout(() => {
        feather.replace();
      }, 0);
    },
    error: (err) => {
      console.error('Load companies error:', err);
      this.rows = [];
      this.tempRows = [];

      Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: err?.error?.message || 'Unable to load company list',
        customClass: {
          confirmButton: 'btn btn-primary'
        },
        buttonsStyling: false
      });
    }
  });
}

  deleteCompany(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${row.companyName || 'this company'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-outline-secondary ml-1'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.companyService.deleteCompany(row.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'Company deleted successfully',
              customClass: {
                confirmButton: 'btn btn-primary'
              },
              buttonsStyling: false
            });

            this.loadCompanies();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete failed',
              text: err?.error?.message || 'Something went wrong',
              customClass: {
                confirmButton: 'btn btn-primary'
              },
              buttonsStyling: false
            });
          }
        });
      }
    });
  }

  openCompanySidebar(): void {
    this.resetForm();
    this.showSidebar = true;

    setTimeout(() => {
      this.sidebarService.getSidebarRegistry('new-company-sidebar')?.open();
    }, 0);
  }

  closeCompanySidebar(): void {
    this.sidebarService.getSidebarRegistry('new-company-sidebar')?.close();
    this.showSidebar = false;
    this.resetForm();
  }

onCompanySaved(): void {
  debugger
  this.closeCompanySidebar();

  setTimeout(() => {
    this.loadCompanies();
  }, 200);
}


  onCompanySidebarClosed(): void {
    this.sidebarService.getSidebarRegistry('new-company-sidebar')?.close();
    this.showSidebar = false;
  }

  editCompany(row: any): void {
    this.companyService.getCompanyById(row.id).subscribe({
      next: (res) => {
        const data = res?.data || res;

        this.model = {
          id: data.id,
          companyCode: data.companyCode || '',
          companyName: data.companyName || '',
          contactPerson: data.contactPerson || '',
          contactNo: data.contactNo || '',
          email: data.email || '',
          password: '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          stateName: data.stateName || '',
          postalCode: data.postalCode || '',
          isActive: data.isActive ?? true,
          userId: 1,

          username: data.username || '',
          userContactNo: data.userContactNo || '',

          locationIds: data.locationIds || [],
          sessionIds: data.sessionIds || (data.sessionTimings || []).map((x: any) => x.sessionId),
          sessionTimings: data.sessionTimings || [],
          cuisineIds: data.cuisineIds || []
        };

        this.confirmPassword = '';
        this.showSidebar = true;

        setTimeout(() => {
          this.sidebarService.getSidebarRegistry('new-company-sidebar')?.open();
        }, 0);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err?.error?.message || 'Unable to load company details',
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  submit(form: NgForm): void {
    if (form.invalid) return;

    if (!this.model.id && this.model.password !== this.confirmPassword) {
      alert('Password and Confirm Password do not match');
      return;
    }

    this.companyService.saveCompany(this.model).subscribe({
      next: () => {
        alert(this.model.id ? 'Company updated successfully' : 'Company created successfully');
        this.loadCompanies();
        this.closeCompanySidebar();
      },
      error: err => {
        alert(err?.error?.message || 'Save failed');
      }
    });
  }

  toggleCompanyStatus(row: any): void {
    const payload = {
      id: row.id,
      companyCode: row.companyCode,
      companyName: row.companyName,
      contactPerson: row.contactPerson,
      contactNo: row.contactNo,
      email: row.email,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      stateName: row.stateName,
      postalCode: row.postalCode,
      isActive: !row.isActive,
      userId: 1,
      password: null
    };

    this.companyService.saveCompany(payload).subscribe({
      next: () => {
        this.loadCompanies();
      },
      error: err => {
        alert(err?.error?.message || 'Status update failed');
      }
    });
  }

  filterUpdate(event: any): void {
    const val = (event.target.value || '').toLowerCase();

    const temp = this.tempRows.filter(
      (d: any) =>
        (d.companyCode || '').toLowerCase().includes(val) ||
        (d.companyName || '').toLowerCase().includes(val) ||
        (d.contactPerson || '').toLowerCase().includes(val) ||
        (d.email || '').toLowerCase().includes(val) ||
        !val
    );

    this.rows = temp;
  }

  applyFilter(): void {
    let data = [...this.tempRows];

    if (this.filterCompanyName) {
      data = data.filter((x: any) =>
        (x.companyName || '').toLowerCase().includes(this.filterCompanyName.toLowerCase())
      );
    }

    if (this.filterEmail) {
      data = data.filter((x: any) =>
        (x.email || '').toLowerCase().includes(this.filterEmail.toLowerCase())
      );
    }

    if (this.selectedStatus !== null && this.selectedStatus !== undefined) {
      data = data.filter((x: any) => x.isActive === this.selectedStatus);
    }

    this.rows = data;
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((x: string) => x.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
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
      userId: 1
    };

    this.confirmPassword = '';
  }
}