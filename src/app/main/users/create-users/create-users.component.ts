import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { UserMasterPayload, UsersService } from '../users-service/users.service';
import { CateringService } from 'app/main/services/catering.service';

@Component({
  selector: 'app-create-users',
  templateUrl: './create-users.component.html',
  styleUrls: ['./create-users.component.scss']
})
export class CreateUsersComponent implements OnInit, OnChanges {
  @Output() userSaved: EventEmitter<void> = new EventEmitter<void>();

  // edit ku id mattum varum
  @Input() editUserId: number | null = null;

  public id: number | null = null;
  public username: string = '';
  public email: string = '';
  public password: string = '';
  public confirmPassword: string = '';
  public isActive: boolean = true;
  public isDelete: boolean = false;

  // logged in user context
  public loginUserId: number = 0;
  public loginRoleId: number = 0;
  public loginCompanyId: number | null = null;
  public loginCompanyName: string = '';

  // form values
  public roleId: number = 0;
  public companyId: number | null = null;
  public selectedCompanyId: number | null = null;
  public companyName: string = '';

  public isSuperAdmin: boolean = false;
  public isSubmitting: boolean = false;
  public isEditMode: boolean = false;
  public isLoadingUser: boolean = false;

  public companyList: Array<any> = [];

  constructor(
    private _coreSidebarService: CoreSidebarService,
    private _usersService: UsersService,
    private _companyService: CateringService
  ) {}

  ngOnInit(): void {
    this.loadLoginContext();
    this.loadCompanyList();
    this.prepareCreateDefaults();
  }

ngOnChanges(changes: SimpleChanges): void {
  if (changes['editUserId']) {
    if (this.editUserId && this.editUserId > 0) {
      this.loadUserById(this.editUserId);
    } else {
      this.prepareCreateDefaults();
    }
  }
}

  get passwordMismatch(): boolean {
    if (this.isEditMode && !this.password && !this.confirmPassword) {
      return false;
    }

    return !!this.password && !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  loadLoginContext(): void {
    const roleIdFromStorage =
      localStorage.getItem('roleId') ||
      localStorage.getItem('RoleId') ||
      localStorage.getItem('roleID');

    const companyIdFromStorage =
      localStorage.getItem('companyId') ||
      localStorage.getItem('CompanyId') ||
      localStorage.getItem('companyID');

    const companyNameFromStorage =
      localStorage.getItem('companyName') ||
      localStorage.getItem('CompanyName');

    const userIdFromStorage =
      localStorage.getItem('userId') ||
      localStorage.getItem('UserId');

    this.loginRoleId = roleIdFromStorage ? Number(roleIdFromStorage) : 0;
    this.loginCompanyId = companyIdFromStorage ? Number(companyIdFromStorage) : null;
    this.loginCompanyName = companyNameFromStorage ? companyNameFromStorage : '';
    this.loginUserId = userIdFromStorage ? Number(userIdFromStorage) : 0;

    this.isSuperAdmin = this.loginRoleId === 1;
  }

  loadCompanyList(): void {
    this._companyService.getCompanies().subscribe({
      next: (res: any) => {
        this.companyList = res?.data || [];
        this.syncCompanyName();
      },
      error: () => {
        this.companyList = [];
      }
    });
  }

prepareCreateDefaults(): void {
  this.isEditMode = false;
  this.id = null;
  this.username = '';
  this.email = '';
  this.password = '';
  this.confirmPassword = '';
  this.isActive = true;
  this.isDelete = false;

  this.roleId = this.loginRoleId > 0 ? this.loginRoleId : 2;

  if (this.isSuperAdmin) {
    this.companyId = null;
    this.selectedCompanyId = null;
    this.companyName = '';
  } else {
    this.companyId = this.loginCompanyId;
    this.selectedCompanyId = this.loginCompanyId;
    this.companyName = this.loginCompanyName || '';
  }

  // important
  this.syncCompanyName();
}

  loadUserById(id: number): void {
    this.isLoadingUser = true;

    this._usersService.getUserById(id).subscribe({
      next: (res: any) => {
        this.isLoadingUser = false;

        const user = res?.data;
        if (!user) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User details not found'
          });
          return;
        }

        this.isEditMode = true;

        this.id = user.id;
        this.username = user.userName || user.username || '';
        this.email = user.email || '';
        this.password = '';
        this.confirmPassword = '';
        this.isActive = user.isActive === true;

        // IMPORTANT: actual user data from API
        this.roleId = user.roleId || 2;
        this.companyId = user.companyId || null;
        this.selectedCompanyId = user.companyId || null;
        this.companyName = user.companyName || '';

        this.syncCompanyName();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingUser = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load user details'
        });
      }
    });
  }

syncCompanyName(): void {
  const finalCompanyId = this.getFinalCompanyId();

  if (!finalCompanyId) {
    this.companyName = '';
    return;
  }

  // RoleId = 2னா company reset ஆகக்கூடாது
  if (this.roleId === 2 && this.loginCompanyName) {
    this.companyName = this.loginCompanyName;
    this.companyId = this.loginCompanyId;
    this.selectedCompanyId = this.loginCompanyId;
    return;
  }

  if (!this.companyList?.length) {
    return;
  }

  const matchedCompany = this.companyList.find(
    (x: any) => Number(x.id) === Number(finalCompanyId)
  );

  if (matchedCompany) {
    this.companyName =
      matchedCompany.companyName ||
      matchedCompany.name ||
      '';
  }
}

  toggleSidebar(name: string): void {
    const sidebar = this._coreSidebarService.getSidebarRegistry(name);
    if (sidebar) {
      sidebar.toggleOpen();
    }
  }

getFinalCompanyId(): number | null {
  if (this.roleId === 2) {
    return this.companyId || this.loginCompanyId;
  }

  return this.isSuperAdmin ? this.selectedCompanyId : this.companyId;
}

  submit(form: any): void {
    if (!form.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please fill all required fields'
      });
      return;
    }

    if (this.passwordMismatch) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Password and Confirm Password must match'
      });
      return;
    }

    const finalCompanyId = this.getFinalCompanyId();

    if (!finalCompanyId || finalCompanyId <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Company is required'
      });
      return;
    }

    if (!this.isEditMode && !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Password is required'
      });
      return;
    }

    const payload: UserMasterPayload = {
      id: this.id || undefined,
      companyId: finalCompanyId,
      roleId: this.roleId, // fetched user role / create role
      username: this.username ? this.username.trim() : '',
      email: this.email ? this.email.trim() : '',
      password: this.password ? this.password.trim() : '',
      isActive: this.isActive,
      isDelete:this.isDelete,
      createdBy: this.loginUserId || 1,
      updatedBy: this.loginUserId || 1
    };

    this.isSubmitting = true;

    const request$ = this.isEditMode
      ? this._usersService.updateUser(payload)
      : this._usersService.createUser(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        if (res?.status || res?.isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: res?.message || (this.isEditMode ? 'User updated successfully' : 'User created successfully')
          });

          this.userSaved.emit();
          form.resetForm();
          this.prepareCreateDefaults();
          this.toggleSidebar('new-user-sidebar');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: res?.message || (this.isEditMode ? 'Failed to update user' : 'Failed to create user')
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || (this.isEditMode ? 'Failed to update user' : 'Failed to create user')
        });
      }
    });
  }

  resetFormState(form?: any): void {
  if (form) {
    form.resetForm();
  }

  this.prepareCreateDefaults();
}
onCancel(form: any): void {
  //this.resetFormState(form);
  this.toggleSidebar('new-user-sidebar');
}
}