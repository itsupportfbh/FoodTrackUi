import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { RequestService } from '../request-service';
import { debug } from 'console';


@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss']
})
export class RequestListComponent implements OnInit {

   rows: any[] = [];
  filteredRows: any[] = [];

  searchText = '';
  selectedOption = 10;

  userId = 0;
  companyId = 0;
  isAdmin = false;

  constructor(
    private requestService: RequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
    const currentUser = JSON.parse(currentUserRaw);
    this.userId = Number(currentUser.id || 0);
    this.companyId = Number(currentUser.companyId || 0);
   
    }

    const role = (localStorage.getItem('role') || '').toLowerCase();
    this.isAdmin = role.includes('admin');

    this.loadRequests();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  loadRequests(): void {
    const payload = {
      userId: this.userId,
      companyId: this.companyId,
      isAdmin: this.isAdmin
    };

    this.requestService.getAllRequests(payload).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.filteredRows = [...this.rows];
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load requests', 'error');
      }
    });
  }

  filterRequests(): void {
    debugger
    const text = (this.searchText || '').trim().toLowerCase();

    if (!text) {
      this.filteredRows = [...this.rows];
      return;
    }

    this.filteredRows = this.rows.filter((x: any) =>
      (x.companyName || '').toLowerCase().includes(text) ||
      (x.sessionName || '').toLowerCase().includes(text) ||
      (x.cuisineName || '').toLowerCase().includes(text) ||
      (x.locationName || '').toLowerCase().includes(text) ||
      (x.qty || '').toString().toLowerCase().includes(text) ||
      (x.fromDate || '').toString().toLowerCase().includes(text) ||
      (x.toDate || '').toString().toLowerCase().includes(text)
    );
  }

  onPageSizeChange(): void {
    // placeholder if later using pagination lib
  }

  openCreate(): void {
    this.router.navigate(['/catering/request-create']);
  }

  editRequest(row: any): void {
    this.router.navigate(['/catering/request-edit', row.requestId]);
  }

  deleteRequest(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This request will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ea5455'
    }).then((result) => {
      if (result.isConfirmed) {
        this.requestService.deleteRequest(row.id, this.userId).subscribe({
          next: (res: any) => {
            Swal.fire('Deleted', res?.message || 'Request deleted successfully', 'success');
            this.loadRequests();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', err?.error?.message || 'Delete failed', 'error');
          }
        });
      }
    });
  }

  get pagedRows(): any[] {
    return this.filteredRows.slice(0, this.selectedOption);
  }

}


