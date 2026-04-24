import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as feather from 'feather-icons';
import { UsersService } from '../users-service/users.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UsersListComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  public ColumnMode = ColumnMode;
  public selectedOption: number | 'all' = 10;
  public pageLimit = 10;
  public showPagination = true;
  public searchValue = '';

  public rows: any[] = [];
  public tempRows: any[] = [];
  public loading = false;

  public currentUserId = 0;
  public currentRoleId = 0;
  public currentCompanyId = 0;

  public selectedUserId: number | null = null;

  public showBulkUploadModal = false;
  public selectedBulkFile: File | null = null;
  public isUploading = false;

  constructor(
    private _coreSidebarService: CoreSidebarService,
    private _usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.getAllUsers();
  }

  private refreshFeatherIcons(): void {
    setTimeout(() => {
      feather.replace();
    }, 0);
  }

  loadCurrentUser(): void {
    const currentUserRaw = localStorage.getItem('currentUser');

    let currentUser: any = null;

    try {
      currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    } catch {
      currentUser = null;
    }

    this.currentUserId = Number(
      localStorage.getItem('id') ||
        localStorage.getItem('userId') ||
        currentUser?.id ||
        0
    );

    this.currentRoleId = Number(
      localStorage.getItem('roleId') ||
        currentUser?.roleId ||
        0
    );

    this.currentCompanyId = Number(
      localStorage.getItem('companyId') ||
        currentUser?.companyId ||
        0
    );
  }

  getAllUsers(): void {
    this.loading = true;

    this._usersService
      .getAllUsers(this.currentUserId, this.currentRoleId, this.currentCompanyId)
      .subscribe({
        next: (res: any) => {
          this.loading = false;

          const data = res?.data || [];

          this.rows = data.map((item: any) => ({
            id: item.id,
            fullName: item.userName || '',
            username: item.userName || '',
            email: item.email || '',
            companyName: item.companyName || '-',
            companyCode: item.companyCode || '-',
            roleName: item.roleName || '-',
            planType: item.planType || '-',
            status: item.isActive ? 'Active' : 'Inactive',
            isActive: item.isActive === true
          }));

          this.tempRows = [...this.rows];
          this.updatePaging();

          if (this.table) {
            this.table.offset = 0;
          }

          this.refreshFeatherIcons();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to load users'
          });
        }
      });
  }

  onPageSizeChange(): void {
    this.updatePaging();

    if (this.table) {
      this.table.offset = 0;
    }
  }

  private updatePaging(): void {
    if (this.selectedOption === 'all') {
      this.pageLimit = this.rows.length || 1;
      this.showPagination = false;
    } else {
      this.pageLimit = Number(this.selectedOption) || 10;
      this.showPagination = true;
    }
  }

  filterUpdate(event: any): void {
    const val = (event.target.value || '').toLowerCase();

    this.rows = this.tempRows.filter((d: any) => {
      return (
        (d.fullName || '').toLowerCase().includes(val) ||
        (d.email || '').toLowerCase().includes(val) ||
        (d.companyName || '').toLowerCase().includes(val) ||
        (d.companyCode || '').toLowerCase().includes(val) ||
        (d.roleName || '').toLowerCase().includes(val) ||
        (d.planType || '').toLowerCase().includes(val) ||
        (d.status || '').toLowerCase().includes(val)
      );
    });

    this.updatePaging();

    if (this.table) {
      this.table.offset = 0;
    }
  }

  exportToExcel(): void {
    const exportRows = this.rows.map((item: any, index: number) => ({
      'S.No': index + 1,
      'User Name': item.fullName,
      Email: item.email,
      Company: item.companyName,
      'Company Code': item.companyCode,
      Role: item.roleName,
      'Plan Type': item.planType,
      Status: item.status
    }));

    if (!exportRows.length) {
      Swal.fire('No Data', 'No records to export', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'User_List.xlsx');
  }

  downloadUserTemplate(): void {
    this._usersService.downloadUserTemplate().subscribe({
      next: (res: Blob) => {
        const blob = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'User_Template.xlsx';
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'Template download failed', 'error');
      }
    });
  }

  openBulkUploadModal(): void {
    this.selectedBulkFile = null;
    this.showBulkUploadModal = true;
  }

  closeBulkUploadModal(): void {
    this.selectedBulkFile = null;
    this.showBulkUploadModal = false;
  }

  onBulkFileSelected(event: any): void {
    const file = event?.target?.files?.[0];

    if (!file) {
      this.selectedBulkFile = null;
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      Swal.fire('Invalid File', 'Upload Excel file only', 'warning');
      this.selectedBulkFile = null;
      return;
    }

    this.selectedBulkFile = file;
  }

  uploadBulkUsers(): void {
    if (!this.currentCompanyId) {
      Swal.fire('Error', 'Company not found from login', 'error');
      return;
    }

    if (!this.selectedBulkFile) {
      Swal.fire('Error', 'Please select file', 'warning');
      return;
    }

    const formData = new FormData();

    formData.append('file', this.selectedBulkFile);
    formData.append('updatedBy', String(this.currentUserId || 1));
    formData.append('companyId', String(this.currentCompanyId));

    this.isUploading = true;

    this._usersService.bulkUploadUsers(formData).subscribe({
      next: (res: any) => {
        this.isUploading = false;

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res?.message || 'Upload successful',
          showConfirmButton: false,
          timer: 1500
        });

        this.closeBulkUploadModal();
        this.getAllUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.isUploading = false;

        Swal.fire(
          'Error',
          err?.error?.message || 'Upload failed',
          'error'
        );
      }
    });
  }

  toggleSidebar(name: string): void {
    const sidebar = this._coreSidebarService.getSidebarRegistry(name);

    if (sidebar) {
      sidebar.toggleOpen();
    }
  }

  openCreateSidebar(): void {
    this.selectedUserId = 0;

    setTimeout(() => {
      this.selectedUserId = null;
      this.toggleSidebar('new-user-sidebar');
    }, 0);
  }

  editUser(row: any): void {
    this.selectedUserId = row.id;
    this.toggleSidebar('new-user-sidebar');
  }

  onUserSaved(): void {
    this.selectedUserId = null;
    this.getAllUsers();
  }

  toggleUserStatus(row: any): void {
    if (!row.isActive) {
      Swal.fire('Info', 'Already inactive', 'info');
      return;
    }

    Swal.fire({
      title: 'Deactivate?',
      text: `Deactivate ${row.fullName}?`,
      icon: 'question',
      showCancelButton: true
    }).then((res) => {
      if (res.isConfirmed) {
        this._usersService.deleteUser(row.id, this.currentUserId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'User deactivated',
              showConfirmButton: false,
              timer: 1500
            });

            this.getAllUsers();
          },
          error: () => {
            Swal.fire('Error', 'Failed', 'error');
          }
        });
      }
    });
  }

  getInitials(name: string): string {
    if (!name) {
      return '';
    }

    return name
      .split(' ')
      .map((x) => x[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}