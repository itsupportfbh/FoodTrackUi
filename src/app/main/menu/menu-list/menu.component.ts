import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { SessionService } from 'app/main/Master/session/session.service';
import { CuisineService } from 'app/main/Master/cuisine/cuisine-service';
import { MenuService } from '../menuService/menu.service';

interface SessionItem {
  id: number;
  name: string;
  start?: string;
  end?: string;
}

interface CuisineItem {
  id: number;
  name: string;
}

interface MenuRow {
  date: string;
  sessionName: string;
  cuisineName: string;
  setName: string;
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  notes: string;
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  sessionList: SessionItem[] = [];
  cuisineList: CuisineItem[] = [];
  rows: MenuRow[] = [];
  uploadInfo = 'No file uploaded';

  groupedMenu: any = {};
  sessionTabs: string[] = [];
  activeSessionTab: string = '';
  isLoadingSessions = false;
  isLoadingCuisines = false;
  isSavingMenu = false;
  isLoadingMenu = false;

  currentWeekKey: string = '';
  currentWeekSessions: any = {};

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  roleId: number = 0;

  constructor(
    private sessionService: SessionService,
    private cusineService: CuisineService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.setRoleIdFromLocalStorage();
    this.getSessionList();
    this.getCuisineList();
    this.loadMenuFromDb();
  }

  get isAdminRole(): boolean {
    return this.roleId === 1;
  }

  private setRoleIdFromLocalStorage(): void {
    const roleValue =
      localStorage.getItem('roleId') ||
      localStorage.getItem('RoleId') ||
      localStorage.getItem('roleID') ||
      '0';

    this.roleId = Number(roleValue) || 0;
  }

  getSessionList(): void {
    this.isLoadingSessions = true;

    this.sessionService.getSession().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.result || []);

        this.sessionList = (data || [])
          .map((item: any, index: number) => ({
            id: item.id ?? item.Id ?? index + 1,
            name: item.name ?? item.sessionName ?? item.SessionName ?? '',
            start: item.start ?? item.startTime ?? item.StartTime ?? item.fromTime ?? '',
            end: item.end ?? item.endTime ?? item.EndTime ?? item.toTime ?? ''
          }))
          .filter((x: SessionItem) => !!x.name);

        this.isLoadingSessions = false;
      },
      error: (error: any) => {
        console.error('Error loading sessions:', error);
        this.isLoadingSessions = false;
      }
    });
  }

  getCuisineList(): void {
    this.isLoadingCuisines = true;

    this.cusineService.getAllCuisine().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.result || []);

        this.cuisineList = (data || [])
          .map((item: any, index: number) => ({
            id: item.id ?? item.Id ?? index + 1,
            name:
              item.name ??
              item.cuisineName ??
              item.CuisineName ??
              item.cuisine ??
              item.Cuisine ??
              ''
          }))
          .filter((x: CuisineItem) => !!x.name);

        this.isLoadingCuisines = false;
      },
      error: (error: any) => {
        console.error('Error loading cuisines:', error);
        this.isLoadingCuisines = false;
      }
    });
  }

  loadMenuFromDb(): void {
    this.isLoadingMenu = true;

    this.menuService.getMenuByMonthYear(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.result || []);

        this.rows = (data || []).map((row: any) => ({
          date: this.normalizeDate(row.date || row.Date || ''),
          sessionName: String(row.sessionName || row.SessionName || '').trim(),
          cuisineName: String(row.cuisineName || row.CuisineName || '').trim(),
          setName: String(row.setName || row.SetName || '').trim(),
          item1: String(row.item1 || row.Item1 || '').trim(),
          item2: String(row.item2 || row.Item2 || '').trim(),
          item3: String(row.item3 || row.Item3 || '').trim(),
          item4: String(row.item4 || row.Item4 || '').trim(),
          notes: String(row.notes || row.Notes || '').trim()
        }));

        this.uploadInfo = this.rows.length
          ? `${this.rows.length} menu rows loaded from database`
          : 'No menu found for selected month';

        this.refreshPreview();
        this.isLoadingMenu = false;
      },
      error: (error: any) => {
        console.error('Error loading menu from DB:', error);
        this.rows = [];
        this.refreshPreview();
        this.uploadInfo = 'Failed to load menu from database';
        this.isLoadingMenu = false;
      }
    });
  }

  onMonthYearChange(): void {
    this.loadMenuFromDb();
  }

  refreshPreview(): void {
    const normalizedRows = (this.rows || [])
      .map(row => ({
        ...row,
        date: this.normalizeDate(row.date),
        cuisineName: (row.cuisineName || '').trim(),
        sessionName: (row.sessionName || '').trim()
      }))
      .filter(row => !!row.date);

    this.currentWeekKey = this.getUploadedWeekRangeLabel(normalizedRows);
    this.currentWeekSessions = this.groupRowsBySessionFixedWeek(normalizedRows);
    this.buildSessionTabs();
    this.setDefaultActiveTab();
  }

  buildSessionTabs(): void {
    this.sessionTabs = Object.keys(this.currentWeekSessions || {}).filter(Boolean);
  }

  setDefaultActiveTab(): void {
    if (!this.sessionTabs.length) {
      this.activeSessionTab = '';
      return;
    }

    if (this.activeSessionTab && this.sessionTabs.includes(this.activeSessionTab)) {
      return;
    }

    this.activeSessionTab = this.sessionTabs[0];
  }

  setActiveSessionTab(sessionName: string): void {
    this.activeSessionTab = sessionName;
  }

  getActiveSessionDates(): string[] {
    if (!this.activeSessionTab || !this.currentWeekSessions?.[this.activeSessionTab]) {
      return [];
    }

    return this.getSortedDates(this.currentWeekSessions[this.activeSessionTab]);
  }

  getActiveSessionCuisineNames(): string[] {
    if (!this.activeSessionTab || !this.currentWeekSessions?.[this.activeSessionTab]) {
      return [];
    }

    return this.getAllCuisineNames(this.currentWeekSessions[this.activeSessionTab]);
  }

  getActiveSessionSetNamesByCuisine(cuisineName: string): string[] {
    if (!this.activeSessionTab || !this.currentWeekSessions?.[this.activeSessionTab]) {
      return [];
    }

    return this.getAllSetNamesByCuisine(this.currentWeekSessions[this.activeSessionTab], cuisineName);
  }

  getActiveSessionMenu(date: string, cuisineName: string, setName: string): MenuRow | null {
    if (!this.activeSessionTab || !this.currentWeekSessions?.[this.activeSessionTab]) {
      return null;
    }

    return this.getMenuByCuisineSetAndDate(
      this.currentWeekSessions[this.activeSessionTab],
      date,
      cuisineName,
      setName
    );
  }

  getUploadedWeekRangeLabel(rows: MenuRow[]): string {
    if (!rows || rows.length === 0) {
      return '';
    }

    const validDates = rows
      .map(x => this.parseDate(x.date))
      .filter(date => this.isValidDate(date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (validDates.length === 0) {
      return '';
    }

    const start = validDates[0];
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${this.formatDateShort(start)} - ${this.formatDateShort(end)}`;
  }

  groupRowsBySessionFixedWeek(rows: MenuRow[]): any {
    const grouped: any = {};

    if (!rows || rows.length === 0) {
      return grouped;
    }

    const validDates = rows
      .map(x => this.parseDate(x.date))
      .filter(date => this.isValidDate(date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (validDates.length === 0) {
      return grouped;
    }

    const startDate = new Date(validDates[0]);
    const fixedWeekDates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      fixedWeekDates.push(this.normalizeDate(d));
    }

    const sessionNames = Array.from(
      new Set(rows.map(x => (x.sessionName || '').trim()).filter(Boolean))
    );

    sessionNames.forEach(sessionName => {
      grouped[sessionName] = {};
      fixedWeekDates.forEach(date => {
        grouped[sessionName][date] = [];
      });
    });

    rows.forEach(row => {
      const sessionName = row.sessionName || 'Unassigned';
      const dayKey = this.normalizeDate(row.date);

      if (!grouped[sessionName]) {
        grouped[sessionName] = {};
        fixedWeekDates.forEach(date => {
          grouped[sessionName][date] = [];
        });
      }

      if (fixedWeekDates.includes(dayKey)) {
        grouped[sessionName][dayKey].push(row);
      }
    });

    return grouped;
  }

  downloadTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const sessions = this.sessionList.length > 0
      ? this.sessionList
      : [
          { id: 1, name: 'Breakfast' },
          { id: 2, name: 'Lunch' }
        ];

    const cuisines = this.cuisineList.length > 0
      ? this.cuisineList
      : [
          { id: 1, name: 'Indian Food' },
          { id: 2, name: 'Chinese Food' },
          { id: 3, name: 'Punjabi Food' }
        ];

    const totalDays = this.getDaysInMonth(this.selectedYear, this.selectedMonth);

    sessions.forEach((session, index) => {
      const aoaData: any[] = [
        ['Date', 'SessionName', 'CuisineName', 'SetName', 'Item1', 'Item2', 'Item3', 'Item4', 'Notes']
      ];

      for (let day = 1; day <= totalDays; day++) {
        const formattedDate = this.formatTemplateDate(day, this.selectedMonth, this.selectedYear);

        cuisines.forEach(cuisine => {
          aoaData.push([
            formattedDate,
            session.name,
            cuisine.name,
            '',
            '',
            '',
            '',
            '',
            ''
          ]);
        });
      }

      const sheet = XLSX.utils.aoa_to_sheet(aoaData);
      this.applySheetStyles(sheet);

      const safeSheetName = (session.name || `Session${index + 1}`).substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName);
    });

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const monthName = new Date(this.selectedYear, this.selectedMonth - 1, 1)
      .toLocaleString('en-US', { month: 'short' });

    this.saveExcelFile(excelBuffer, `menu_upload_template_${monthName}_${this.selectedYear}`);
  }

  saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob(
      [buffer],
      {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      }
    );
    saveAs(data, `${fileName}.xlsx`);
  }

  onFileChange(event: any): void {
    const target = event.target;
    if (!target.files || target.files.length !== 1) {
      return;
    }

    const file = target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const binaryString: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(binaryString, { type: 'binary' });

      let allRows: MenuRow[] = [];

      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const normalized: MenuRow[] = jsonData
          .map(row => ({
            date: this.normalizeDate(row.Date || row.date || ''),
            sessionName: String(row.SessionName || row.sessionName || sheetName || '').trim(),
            cuisineName: String(row.CuisineName || row.cuisineName || row.Cuisine || row.cuisine || '').trim(),
            setName: String(row.SetName || row.setName || '').trim(),
            item1: String(row.Item1 || row.item1 || '').trim(),
            item2: String(row.Item2 || row.item2 || '').trim(),
            item3: String(row.Item3 || row.item3 || '').trim(),
            item4: String(row.Item4 || row.item4 || '').trim(),
            notes: String(row.Notes || row.notes || '').trim()
          }))
          .filter(r => r.date && r.sessionName && r.cuisineName && r.setName);

        allRows = [...allRows, ...normalized];
      });

      if (!allRows.length) {
        Swal.fire({
          icon: 'warning',
          title: 'No valid rows found',
          text: 'Please upload a valid menu Excel file.'
        });
        return;
      }

      this.rows = allRows;
      this.refreshPreview();
      this.saveMenuToBackend(file.name, allRows);
    };

    reader.readAsBinaryString(file);
    event.target.value = null;
  }

  saveMenuToBackend(fileName: string, allRows: MenuRow[]): void {
    const createdBy = Number(localStorage.getItem('userId')) || 1;

    const payload = {
      menuMonth: this.selectedMonth,
      menuYear: this.selectedYear,
      createdBy: createdBy,
      rows: allRows
    };

    this.isSavingMenu = true;
    this.uploadInfo = 'Saving menu to database...';

    this.menuService.saveMenu(payload).subscribe({
      next: (res: any) => {
        this.isSavingMenu = false;
        this.uploadInfo = `${fileName} uploaded successfully • ${allRows.length} menu rows saved`;

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Menu uploaded successfully'
        });

        this.loadMenuFromDb();
      },
      error: (error: any) => {
        console.error('Error saving menu:', error);
        this.isSavingMenu = false;
        this.uploadInfo = 'Menu upload failed';

        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: error?.error?.message || 'Failed to save menu data'
        });
      }
    });
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  formatTemplateDate(day: number, month: number, year: number): string {
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${year}`;
  }

  private normalizeDate(value: any): string {
    const parsed = this.parseDate(value);
    if (!this.isValidDate(parsed)) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getHeaderStyle(): any {
    return {
      font: {
        bold: true,
        color: { rgb: 'FFFFFF' },
        sz: 12,
        name: 'Calibri'
      },
      fill: {
        fgColor: { rgb: 'A65E2E' }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      border: {
        top: { style: 'thin', color: { rgb: '8B5A3C' } },
        bottom: { style: 'thin', color: { rgb: '8B5A3C' } },
        left: { style: 'thin', color: { rgb: '8B5A3C' } },
        right: { style: 'thin', color: { rgb: '8B5A3C' } }
      }
    };
  }

  private getBodyStyle(isAltRow: boolean = false): any {
    return {
      font: {
        sz: 11,
        name: 'Calibri',
        color: { rgb: '2F2F2F' }
      },
      fill: {
        fgColor: { rgb: isAltRow ? 'FFF8F3' : 'FFFFFF' }
      },
      alignment: {
        horizontal: 'left',
        vertical: 'center'
      },
      border: {
        top: { style: 'thin', color: { rgb: 'E7D8CC' } },
        bottom: { style: 'thin', color: { rgb: 'E7D8CC' } },
        left: { style: 'thin', color: { rgb: 'E7D8CC' } },
        right: { style: 'thin', color: { rgb: 'E7D8CC' } }
      }
    };
  }

  private applySheetStyles(sheet: XLSX.WorkSheet): void {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:I1');

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });

        if (!sheet[cellRef]) {
          continue;
        }

        (sheet[cellRef] as any).s = r === 0
          ? this.getHeaderStyle()
          : this.getBodyStyle(r % 2 === 0);
      }
    }

    sheet['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 }
    ];

    const totalRows = range.e.r + 1;
    sheet['!rows'] = Array.from({ length: totalRows }, (_, i) => ({
      hpx: i === 0 ? 30 : 24
    }));
  }

  formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  getDayName(dateStr: string): string {
    const date = this.parseDate(dateStr);
    if (!this.isValidDate(date)) {
      return '';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short'
    });
  }

  formatCellDate(dateStr: string): string {
    const date = this.parseDate(dateStr);
    if (!this.isValidDate(date)) {
      return '';
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  getSortedDates(daysMap: any): string[] {
    return Object.keys(daysMap || {}).sort(
      (a, b) => this.parseDate(a).getTime() - this.parseDate(b).getTime()
    );
  }

  getAllCuisineNames(daysMap: any): string[] {
    const cuisineNames: string[] = [];

    Object.keys(daysMap || {}).forEach(date => {
      (daysMap[date] || []).forEach((item: MenuRow) => {
        if (item.cuisineName && !cuisineNames.includes(item.cuisineName)) {
          cuisineNames.push(item.cuisineName);
        }
      });
    });

    return cuisineNames;
  }

  getAllSetNamesByCuisine(daysMap: any, cuisineName: string): string[] {
    const setNames: string[] = [];

    Object.keys(daysMap || {}).forEach(date => {
      (daysMap[date] || []).forEach((item: MenuRow) => {
        if (item.cuisineName === cuisineName && item.setName && !setNames.includes(item.setName)) {
          setNames.push(item.setName);
        }
      });
    });

    return setNames;
  }

  getMenuByCuisineSetAndDate(daysMap: any, date: string, cuisineName: string, setName: string): MenuRow | null {
    const rows: MenuRow[] = daysMap[date] || [];
    return rows.find(x => x.cuisineName === cuisineName && x.setName === setName) || null;
  }

  getCurrentWeekSessionNames(): string[] {
    return Object.keys(this.currentWeekSessions || {});
  }

  trackByValue(index: number, value: string): string {
    return value;
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const parsed = new Date(excelEpoch.getTime() + value * 86400000);
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }

    const str = String(value || '').trim();
    if (!str) {
      return new Date('Invalid Date');
    }

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/').map(Number);
      return new Date(y, m - 1, d);
    }

    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
      const [d, m, y] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    return new Date(str);
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}