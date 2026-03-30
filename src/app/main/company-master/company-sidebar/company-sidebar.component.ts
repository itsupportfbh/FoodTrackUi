import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CateringService } from 'app/main/services/catering.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-company-sidebar',
  templateUrl: './company-sidebar.component.html',
  styleUrls:['./company-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompanySidebarComponent implements OnChanges {
  @Input() showSidebar = false;
  @Input() editData: any;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  public confirmPassword = '';

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

  constructor(
    private sidebarService: CoreSidebarService,
    private companyService: CateringService
  ) {}

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
        userId: 1
      };
    } else {
      this.resetForm();
    }

    this.confirmPassword = '';
  }
}
submit(form: NgForm): void {
  if (form.invalid) {
    return;
  }

  if (!this.model.id && this.model.password !== this.confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'Password mismatch',
      text: 'Password and Confirm Password do not match',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    });
    return;
  }

  this.companyService.saveCompany(this.model).subscribe({
    next: () => {
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
      }).then(() => {
        this.saved.emit();
        this.closeCompanySidebar();
        this.resetForm();
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
  this.closed.emit(); // 🔥 IMPORTANT
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
      userId: 1
    };
    this.confirmPassword = '';
  }
   
}