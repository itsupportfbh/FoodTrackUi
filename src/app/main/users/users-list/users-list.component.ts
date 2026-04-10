import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
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
  public selectedOption: number = 10;
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

          if (this.table) {
            this.table.offset = 0;
          }
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


  
  deleteUser(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this._usersService.deleteUser(row.id, this.currentUserId || 1).subscribe({
          next: (res: any) => {
            if (res?.status || res?.isSuccess) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: res?.message || 'User deleted successfully'
              });

              this.getAllUsers();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: res?.message || 'Failed to delete user'
              });
            }
          },
          error: (err: HttpErrorResponse) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to delete user'
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