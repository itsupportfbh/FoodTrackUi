import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { ToastrService } from 'ngx-toastr';
import { RequestOverrideService } from '../request-override.service';

@Component({
  selector: 'app-request-override-list',
  templateUrl: './request-override-list.component.html',
  styleUrls: ['./request-override-list.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class RequestOverrideListComponent implements OnInit, AfterViewInit, AfterViewChecked {
  requestHeaderId = 0;
  requestNo = '';

  rows: any[] = [];
  filteredRows: any[] = [];
  pagedRows: any[] = [];

  loading = false;
  searchText = '';
  selectedOption = 10;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RequestOverrideService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.requestHeaderId = Number(this.route.snapshot.queryParamMap.get('requestHeaderId') || 0);
    this.requestNo = this.route.snapshot.queryParamMap.get('requestNo') || '';

    if (!this.requestHeaderId) {
      this.toastr.error('RequestHeaderId is required');
      return;
    }

    this.loadOverrides();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  loadOverrides(): void {
    this.loading = true;

    this.service.getOverrideList(this.requestHeaderId).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (!res?.isSuccess) {
          this.toastr.error(res?.message || 'Failed to load override list');
          return;
        }

        this.rows = (res?.data || []).map((x: any) => ({
          ...x,
          totalOverrideQty: Number(x.totalOverrideQty || 0),
          lineCount: Number(x.lineCount || 0)
        }));

        this.filteredRows = [...this.rows];
        this.applyPaging();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error while loading override list');
      }
    });
  }

  filterRows(): void {
    const text = (this.searchText || '').trim().toLowerCase();

    if (!text) {
      this.filteredRows = [...this.rows];
    } else {
      this.filteredRows = this.rows.filter((x: any) =>
        (x.notes || '').toLowerCase().includes(text) ||
        (x.fromDate || '').toString().toLowerCase().includes(text) ||
        (x.toDate || '').toString().toLowerCase().includes(text) ||
        (x.totalOverrideQty || '').toString().toLowerCase().includes(text) ||
        (x.lineCount || '').toString().toLowerCase().includes(text)
      );
    }

    this.applyPaging();
  }

  onPageSizeChange(): void {
    this.applyPaging();
  }

  applyPaging(): void {
    this.pagedRows = this.filteredRows.slice(0, this.selectedOption);
  }

  openCreateOverride(): void {
    Swal.fire({
      title: 'Select Override Date Range',
      html: `
        <div style="text-align:left;">
          <label style="display:block; margin:10px 0 6px;">From Date</label>
          <input 
            id="overrideFromDate" 
            type="date" 
            class="swal2-input" 
            style="width:100%; margin:0 0 10px 0;"
          />

          <label style="display:block; margin:10px 0 6px;">To Date</label>
          <input 
            id="overrideToDate" 
            type="date" 
            class="swal2-input" 
            style="width:100%; margin:0;"
          />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Open Override',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#7367f0',
      preConfirm: () => {
        const fromDate = (document.getElementById('overrideFromDate') as HTMLInputElement)?.value;
        const toDate = (document.getElementById('overrideToDate') as HTMLInputElement)?.value;

        if (!fromDate || !toDate) {
          Swal.showValidationMessage('Please select from date and to date');
          return false;
        }

        if (new Date(fromDate) > new Date(toDate)) {
          Swal.showValidationMessage('From date cannot be greater than to date');
          return false;
        }

        return { fromDate, toDate };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.router.navigate(['/catering/request-override'], {
          queryParams: {
            requestHeaderId: this.requestHeaderId,
            fromDate: result.value.fromDate,
            toDate: result.value.toDate
          }
        });
      }
    });
  }

  editOverride(row: any): void {
    this.router.navigate(['/catering/request-override'], {
      queryParams: {
        requestHeaderId: this.requestHeaderId,
        fromDate: this.formatDate(row.fromDate),
        toDate: this.formatDate(row.toDate)
      }
    });
  }

  deleteOverride(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This override will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ea5455'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deleteOverride(row.id).subscribe({
          next: (res: any) => {
            if (res?.isSuccess) {
              this.toastr.success(res?.message || 'Override deleted successfully');
              this.loadOverrides();
            } else {
              this.toastr.error(res?.message || 'Delete failed');
            }
          },
          error: () => {
            this.toastr.error('Error while deleting override');
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/catering/request-list']);
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}