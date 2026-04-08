import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as feather from 'feather-icons';
import { ToastrService } from 'ngx-toastr';
import { RequestOverrideService } from '../request-override.service';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-request-override-list',
  templateUrl: './request-override-list.component.html',
  styleUrls: ['./request-override-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RequestOverrideListComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild(DatatableComponent)
  table!: DatatableComponent;

  public ColumnMode = ColumnMode;
  public searchValue = '';
  public selectedOption = 10;
detailsModalOpen = false;
detailsLoading = false;
selectedRow: any = null;
detailRows: any[] = [];
  companyId :any;
  rows: any[] = [];
  tempData: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RequestOverrideService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.companyId = localStorage.getItem('companyId');
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

    this.service.getOverrideList(this.companyId).subscribe({
      next: (res: any) => {
        this.loading = false;

        const data = Array.isArray(res) ? res : (res?.data || []);

        this.rows = data.map((x: any) => ({
          ...x,
          lineCount: Number(x.lineCount || 0),
          totalOverrideQty: Number(x.totalOverrideQty || 0),
          detailsLoaded: false,
          detailsOpen: false,
          detailRows: []
        }));

        this.tempData = [...this.rows];
        this.rows = [...this.rows];

        if (this.table) {
          this.table.offset = 0;
        }

        setTimeout(() => feather.replace(), 0);
      },
      error: (err) => {
        this.loading = false;
        console.error('Override list error:', err);
        this.toastr.error('Error while loading override list');
      }
    });
  }

  filterUpdate(event: any): void {
    const val = (event.target.value || '').toLowerCase();

    const temp = this.tempData.filter((d: any) => {
      return (
        (d.requestNo || '').toLowerCase().includes(val) ||
        (d.companyName || '').toLowerCase().includes(val) ||
        (d.notes || '').toLowerCase().includes(val) ||
        (d.fromDate || '').toString().toLowerCase().includes(val) ||
        (d.toDate || '').toString().toLowerCase().includes(val) ||
        (d.lineCount || '').toString().toLowerCase().includes(val) ||
        (d.totalOverrideQty || '').toString().toLowerCase().includes(val)
      );
    });

    this.rows = temp;

    if (this.table) {
      this.table.offset = 0;
    }
  }

  toggleDetails(row: any): void {
    this.table.rowDetail.toggleExpandRow(row);

    if (!row.detailsLoaded) {
      this.service.getOverrideLines(row.requestOverrideId).subscribe({
        next: (res: any) => {
          row.detailRows = Array.isArray(res) ? res : (res?.data || []);
          row.detailsLoaded = true;
          this.rows = [...this.rows];
        },
        error: () => {
          this.toastr.error('Error while loading lines');
        }
      });
    }
  }
openDetailsModal(row: any): void {
  this.detailsModalOpen = true;
  this.detailsLoading = true;
  this.selectedRow = row;
  this.detailRows = [];

  this.service.getOverrideLines(row.requestOverrideId).subscribe({
    next: (res: any) => {
      this.detailRows = Array.isArray(res) ? res : (res?.data || []);
      this.detailsLoading = false;
    },
    error: () => {
      this.detailsLoading = false;
      this.toastr.error('Error while loading lines');
    }
  });
}

closeDetailsModal(): void {
  this.detailsModalOpen = false;
  this.detailsLoading = false;
  this.selectedRow = null;
  this.detailRows = [];
}
  goBack(): void {
    this.router.navigate(['/catering/request-list']);
  }
}