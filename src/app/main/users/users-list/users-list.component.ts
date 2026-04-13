import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersService } from '../users-service/users.service';
import * as XLSX from 'xlsx';
import * as feather from 'feather-icons';

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
  public searchValue: string = '';

  public rows: any[] = [];
  public tempRows: any[] = [];
  public loading: boolean = false;

  public currentUserId: number = 0;
  public currentRoleId: number = 0;
  public currentCompanyId: number = 0;

  public selectedUserId: number | null = null;

  constructor(
    private _coreSidebarService: CoreSidebarService,
    private _usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.getAllUsers();
  }

  loadCurrentUser(): void {
    const currentUserRaw = localStorage.getItem('currentUser');

    let currentUser: any = null;

    try {
      currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    } catch (error) {
      currentUser = null;
    }

    this.currentUserId = Number(
      localStorage.getItem('id') ||
      localStorage.getItem('userId') ||
      localStorage.getItem('UserId') ||
      currentUser?.id ||
      0
    );

    this.currentRoleId = Number(
      localStorage.getItem('roleId') ||
      localStorage.getItem('RoleId') ||
      currentUser?.roleId ||
      0
    );

    this.currentCompanyId = Number(
      localStorage.getItem('companyId') ||
      localStorage.getItem('CompanyId') ||
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
            fullName: item.userName || item.username || '',
            username: item.userName || item.username || '',
            email: item.email || '',
            companyId: item.companyId || 0,
            companyName: item.companyName || '-',
            roleName: item.roleName || '-',
            roleId: item.roleId || 0,
            status: item.isActive ? 'active' : 'inactive',
            isActive: item.isActive === true,
            avatar: '',
            createdBy: item.createdBy,
            createdDate: item.createdDate,
            updatedBy: item.updatedBy,
            updatedDate: item.updatedDate
          }));

          this.tempRows = [...this.rows];
          this.updatePaging();

          if (this.table) {
            this.table.offset = 0;
          }

          setTimeout(() => {
            feather.replace();
          }, 0);
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
      this.pageLimit = this.rows.length > 0 ? this.rows.length : 1;
      this.showPagination = false;
    } else {
      this.pageLimit = Number(this.selectedOption) || 10;
      this.showPagination = true;
    }
  }

  exportToExcel(): void {
    const exportRows = (this.rows || []).map((item: any, index: number) => ({
      'S.No': index + 1,
      'User Name': item.fullName || '',
      'Login Name': item.username || '',
      'Email': item.email || '',
      'Company': item.companyName || '',
      'Role': item.roleName || '',
      'Status': item.isActive ? 'Active' : 'Inactive',
      'Created By': item.createdBy || '',
      'Created Date': item.createdDate || '',
      'Updated By': item.updatedBy || '',
      'Updated Date': item.updatedDate || ''
    }));

    if (!exportRows.length) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There are no records to export'
      });
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'User List');

    const fileName = `User_List_${this.formatDateForFileName(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private formatDateForFileName(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}${mm}${dd}_${hh}${min}`;
  }

  filterUpdate(event: any): void {
    const val = (event.target.value || '').toLowerCase();

    const temp = this.tempRows.filter((d: any) => {
      return (
        (d.fullName || '').toLowerCase().includes(val) ||
        (d.username || '').toLowerCase().includes(val) ||
        (d.email || '').toLowerCase().includes(val) ||
        (d.companyName || '').toLowerCase().includes(val) ||
        (d.roleName || '').toLowerCase().includes(val) ||
        (d.status || '').toLowerCase().includes(val)
      );
    });

    this.rows = temp;
    this.updatePaging();

    if (this.table) {
      this.table.offset = 0;
    }
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
    this.selectedUserId = row?.id || null;
    this.toggleSidebar('new-user-sidebar');
  }

  onUserSaved(): void {
    this.selectedUserId = null;
    this.getAllUsers();
  }

toggleUserStatus(row: any): void {
  if (!row.isActive) {
    Swal.fire({
      icon: 'info',
      title: 'Inactive User',
      text: 'This user is already inactive. To activate, separate activate API is required.'
    });
    return;
  }

  Swal.fire({
    title: 'Deactivate User?',
    text: `Do you want to mark ${row.fullName || 'this user'} as Inactive?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Deactivate',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-outline-secondary ml-1'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      this._usersService.deleteUser(row.id, this.currentUserId || 1).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: res?.message || 'User marked as Inactive successfully'
          });

          this.getAllUsers();
        },
        error: (err: HttpErrorResponse) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to update user status'
          });
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
      .map((word: string) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}