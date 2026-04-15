import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { SessionService } from 'app/main/Master/session/session.service';

interface SessionItem {
  id: number;
  name: string;
  start?: string;
  end?: string;
}

interface MenuRow {
  date: string;
  sessionName: string;
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
  rows: MenuRow[] = [];
  uploadInfo = 'Loaded with sample preview data';

  groupedMenu: any = {};
  sessionTabs: string[] = [];
  isLoadingSessions = false;

  currentWeekKey: string = '';
  currentWeekSessions: any = {};

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  constructor(
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.loadSampleData();
    this.getSessionList();
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

        this.refreshPreview();
        this.isLoadingSessions = false;
      },
      error: (error: any) => {
        console.error('Error loading sessions:', error);
        this.isLoadingSessions = false;
        this.refreshPreview();
      }
    });
  }

  loadSampleData(): void {
    this.rows = [
      {
        date: '2026-03-13',
        sessionName: 'Breakfast',
        setName: 'Set A',
        item1: 'Biriyani',
        item2: 'Raitha',
        item3: '',
        item4: '',
        notes: ''
      },
      {
        date: '2026-03-14',
        sessionName: 'Breakfast',
        setName: 'Set B',
        item1: 'Mutton biriyani',
        item2: 'Raitha',
        item3: '',
        item4: '',
        notes: ''
      },
      {
        date: '2026-03-15',
        sessionName: 'Breakfast',
        setName: 'Veg Set C',
        item1: 'Veg Biriyani',
        item2: 'Raitha',
        item3: '',
        item4: '',
        notes: ''
      },
      {
        date: '2026-03-16',
        sessionName: 'Breakfast',
        setName: 'Set A',
        item1: 'Curd Rice',
        item2: 'Pickle',
        item3: '',
        item4: '',
        notes: ''
      },
      {
        date: '2026-03-17',
        sessionName: 'Breakfast',
        setName: 'Set B',
        item1: 'Meals',
        item2: 'Pickle',
        item3: '',
        item4: '',
        notes: ''
      },
      {
        date: '2026-03-18',
        sessionName: 'Breakfast',
        setName: 'Veg Set C',
        item1: 'Variety Rice',
        item2: 'Pickle',
        item3: '',
        item4: '',
        notes: ''
      }
    ];

    this.refreshPreview();
  }

  refreshPreview(): void {
    const normalizedRows = (this.rows || [])
      .map(row => ({
        ...row,
        date: this.normalizeDate(row.date)
      }))
      .filter(row => !!row.date);

    this.currentWeekKey = this.getUploadedWeekRangeLabel(normalizedRows);
    this.currentWeekSessions = this.groupRowsBySessionFixedWeek(normalizedRows);
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

  buildSessionTabsFromRowsOnly(): void {
    const namesFromRows = this.rows
      .map(x => (x.sessionName || '').trim())
      .filter(Boolean);

    const namesFromSessionMaster = this.sessionList
      .map(x => (x.name || '').trim())
      .filter(Boolean);

    const uniqueNames = Array.from(new Set([
      ...namesFromRows,
      ...namesFromSessionMaster
    ]));

    this.sessionTabs = ['All', ...uniqueNames];
  }

  downloadTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const sessions = this.sessionList.length > 0
      ? this.sessionList
      : [
          { id: 1, name: 'Breakfast' },
          { id: 2, name: 'Lunch' }
        ];

    const totalDays = this.getDaysInMonth(this.selectedYear, this.selectedMonth);

    sessions.forEach((session, index) => {
      const aoaData: any[] = [
        ['Date', 'SessionName', 'SetName', 'Item1', 'Item2', 'Item3', 'Item4', 'Notes']
      ];

      for (let day = 1; day <= totalDays; day++) {
        const formattedDate = this.formatTemplateDate(day, this.selectedMonth, this.selectedYear);

        aoaData.push([
          formattedDate,
          session.name,
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
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

  downloadSampleExcel(): void {
    const workbook = XLSX.utils.book_new();

    const sessionNames = Array.from(
      new Set(this.rows.map(x => x.sessionName).filter(Boolean))
    );

    sessionNames.forEach((sessionName, index) => {
      const sessionRows = this.rows.filter(x => x.sessionName === sessionName);

      const aoaData = [
        ['Date', 'SessionName', 'SetName', 'Item1', 'Item2', 'Item3', 'Item4', 'Notes'],
        ...sessionRows.map(x => [
          this.convertIsoToTemplateDate(x.date),
          x.sessionName,
          x.setName,
          x.item1,
          x.item2,
          x.item3,
          x.item4,
          x.notes
        ])
      ];

      const sheet = XLSX.utils.aoa_to_sheet(aoaData);
      this.applySheetStyles(sheet);

      const safeSheetName = (sessionName || `Session${index + 1}`).substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName);
    });

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    this.saveExcelFile(excelBuffer, 'sample_menu_data');
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
            setName: String(row.SetName || row.setName || '').trim(),
            item1: String(row.Item1 || row.item1 || '').trim(),
            item2: String(row.Item2 || row.item2 || '').trim(),
            item3: String(row.Item3 || row.item3 || '').trim(),
            item4: String(row.Item4 || row.item4 || '').trim(),
            notes: String(row.Notes || row.notes || '').trim()
          }))
          .filter(r => r.date && r.sessionName && r.setName);

        allRows = [...allRows, ...normalized];
      });

      this.rows = allRows;
      this.uploadInfo = `${file.name} uploaded successfully • ${allRows.length} menu rows loaded`;
      this.refreshPreview();
    };

    reader.readAsBinaryString(file);
    event.target.value = null;
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  formatTemplateDate(day: number, month: number, year: number): string {
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${year}`;
  }

  convertIsoToTemplateDate(value: string): string {
    const parsed = this.parseDate(value);
    if (!this.isValidDate(parsed)) {
      return '';
    }

    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
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
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:H1');

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

  groupRows(rows: MenuRow[]): any {
    const grouped: any = {};

    rows.forEach(row => {
      const parsedDate = this.parseDate(row.date);
      if (!this.isValidDate(parsedDate)) {
        return;
      }

      const normalizedDate = this.normalizeDate(row.date);
      const weekLabel = this.getWeekLabel(normalizedDate);
      const sessionName = row.sessionName || 'Unassigned';
      const dayKey = normalizedDate;

      if (!grouped[weekLabel]) {
        grouped[weekLabel] = {};
      }

      if (!grouped[weekLabel][sessionName]) {
        grouped[weekLabel][sessionName] = {};
      }

      if (!grouped[weekLabel][sessionName][dayKey]) {
        grouped[weekLabel][sessionName][dayKey] = [];
      }

      grouped[weekLabel][sessionName][dayKey].push({
        ...row,
        date: normalizedDate
      });
    });

    return grouped;
  }

  getWeekLabel(dateStr: string): string {
    const date = this.parseDate(dateStr);
    if (!this.isValidDate(date)) {
      return '';
    }

    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${this.formatDateShort(start)} - ${this.formatDateShort(end)}`;
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
      weekday: 'long'
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

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getSortedDates(daysMap: any): string[] {
    return Object.keys(daysMap || {}).sort(
      (a, b) => this.parseDate(a).getTime() - this.parseDate(b).getTime()
    );
  }

  getAllSetNames(daysMap: any): string[] {
    const setNames: string[] = [];

    Object.keys(daysMap || {}).forEach(date => {
      (daysMap[date] || []).forEach((item: MenuRow) => {
        if (item.setName && !setNames.includes(item.setName)) {
          setNames.push(item.setName);
        }
      });
    });

    return setNames;
  }

  getMenuBySetAndDate(daysMap: any, date: string, setName: string): MenuRow | null {
    const rows: MenuRow[] = daysMap[date] || [];
    return rows.find(x => x.setName === setName) || null;
  }

  findCurrentWeekKey(weekKeys: string[]): string {
    if (!weekKeys || weekKeys.length === 0) {
      return '';
    }

    const today = new Date();
    const currentWeekLabel = this.getWeekLabelFromDate(today);

    if (weekKeys.includes(currentWeekLabel)) {
      return currentWeekLabel;
    }

    return weekKeys
      .filter(Boolean)
      .sort((a, b) => {
        const aStart = this.getWeekStartDateFromLabel(a).getTime();
        const bStart = this.getWeekStartDateFromLabel(b).getTime();
        return bStart - aStart;
      })[0] || '';
  }

  getWeekLabelFromDate(date: Date): string {
    if (!this.isValidDate(date)) {
      return '';
    }

    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${this.formatDateShort(start)} - ${this.formatDateShort(end)}`;
  }

  getWeekStartDateFromLabel(label: string): Date {
    const startPart = (label || '').split(' - ')[0]?.trim();
    if (!startPart) {
      return new Date(0);
    }

    const currentYear = new Date().getFullYear();
    const parsed = new Date(`${startPart} ${currentYear}`);
    return this.isValidDate(parsed) ? parsed : new Date(0);
  }

  getCurrentWeekSessionNames(): string[] {
    return Object.keys(this.currentWeekSessions || {});
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