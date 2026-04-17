import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { CuisinePriceService } from '../cuisine-price.service';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PriceListComponent implements OnInit {
  ColumnMode = ColumnMode;

  rows: any[] = [];
  filteredRows: any[] = [];
  pagedRows: any[] = [];

  searchText: string = '';

  page = {
    pageNumber: 0,
    size: 10
  };

  loading = false;

  constructor(private priceService: CuisinePriceService,private router: Router) {}

  ngOnInit(): void {
    this.getPriceList();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  getPriceList(): void {
    this.loading = true;

    this.priceService.getPriceList().subscribe({
      next: (res: any) => {
        this.rows = (res || [])
          .map((item: any) => ({
            id: item.id,
            priceId: item.priceId,
            companyId: item.companyId,
            companyName: item.companyName,
            sessionId: item.sessionId,
            sessionName: item.sessionName,
            cuisineId: item.cuisineId,
            cuisineName: item.cuisineName,
            rate: item.rate,
            effectiveFrom: item.effectiveFrom,
            effectiveTo: item.effectiveTo,
            actionType: item.actionType,
            isCurrent: item.isCurrent
          }))
          .filter((item: any) => item.isCurrent);

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.rows = [];
        this.filteredRows = [];
        this.pagedRows = [];

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to load price list'
        });
      }
    });
  }

  applyFilters(): void {
    let data = [...this.rows];

    if (this.searchText && this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase().trim();

      data = data.filter(x =>
        (x.companyName || '').toLowerCase().includes(search) ||
        (x.sessionName || '').toLowerCase().includes(search) ||
        (x.cuisineName || '').toLowerCase().includes(search) ||
        (x.rate != null ? x.rate.toString() : '').includes(search)
      );
    }

    this.filteredRows = data;
    this.page.pageNumber = 0;
    this.setPagedRows();
  }

  setPagedRows(): void {
    const start = this.page.pageNumber * this.page.size;
    const end = start + this.page.size;
    this.pagedRows = this.filteredRows.slice(start, end);
  }

  onPageChange(event: any): void {
    this.page.pageNumber = event.offset;
    this.setPagedRows();
  }

  onPageSizeChange(): void {
    this.page.pageNumber = 0;
    this.setPagedRows();
  }

  onAddPrice(): void {
    this.router.navigate(['/master/price']);
  }

  editPrice(row: any): void {
    this.router.navigate(['/master/price'], {
      queryParams: {
        companyId: row.companyId,
        sessionId: row.sessionId
      }
    });
  }

  exportPriceList(): void {
    this.priceService.exportPriceList().subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PriceList.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'Failed to export price list', 'error');
      }
    });
  }
}
