import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import * as feather from 'feather-icons';
import Swal from 'sweetalert2';
import { SessionService } from './session.service';
import { NgbTimepicker } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-session',
  
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('addForm') addFormForm!: NgForm;
  @ViewChild('fromWrapper') fromWrapper!: ElementRef;
  @ViewChild('toWrapper') toWrapper!: ElementRef;

  public id = 0;

  isDisplay = false;
  modeHeader = 'Create session';
  resetButton = true;
  rows: any[] = [];
  tempData: any;
  sessionValue: any;
  isEditMode = false;

  sessionName = '';
  description = '';

  fromTime: NgbTimeStruct | null = null;
  toTime: NgbTimeStruct | null = null;

  showFromPicker = false;
  showToPicker = false;

  constructor(private _service: SessionService) {}

  ngOnInit(): void {
    this.getAllsessions();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsideFrom =
      this.fromWrapper?.nativeElement?.contains(target) ?? false;
    const clickedInsideTo =
      this.toWrapper?.nativeElement?.contains(target) ?? false;

    if (!clickedInsideFrom && !clickedInsideTo) {
      this.closePickers();
    }
  }

  createsessions(): void {
    this.isDisplay = true;
    this.isEditMode = false;
    this.resetButton = true;
    this.modeHeader = 'Create session';
    this.reset();
  }

  cancel(): void {
    this.isDisplay = false;
    this.isEditMode = false;
    this.closePickers();
  }

  reset(): void {
    this.id = 0;
    this.sessionName = '';
    this.description = '';
    this.fromTime = null;
    this.toTime = null;
    this.closePickers();

    if (this.addFormForm) {
      this.addFormForm.resetForm({
        sessionName: '',
        description: ''
      });
    }
  }

  getAllsessions(): void {
    this._service.getSession().subscribe((response: any) => {
      this.rows = response.data || [];
      this.tempData = this.rows;
    });
  }

  toggleFromPicker(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.showFromPicker = !this.showFromPicker;
    this.showToPicker = false;
  }

  toggleToPicker(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.showToPicker = !this.showToPicker;
    this.showFromPicker = false;
  }

  closePickers(): void {
    this.showFromPicker = false;
    this.showToPicker = false;
  }

  onTimeAreaClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  formatTime(time: NgbTimeStruct | null): string {
    if (!time) return '';

    let hour = time.hour;
    const minute = String(time.minute).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12 || 12;

    return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
  }

  formatDisplayTime(timeString: string): string {
    if (!timeString) return '';

    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;

    let hour = +parts[0];
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12 || 12;

    return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
  }

  getTimeString(time: NgbTimeStruct | null): string | null {
    if (!time) return null;

    const h = String(time.hour).padStart(2, '0');
    const m = String(time.minute).padStart(2, '0');

    return `${h}:${m}:00`;
  }

  convertToTimeStruct(timeString: string): NgbTimeStruct {
    if (!timeString) {
      return { hour: 0, minute: 0, second: 0 };
    }

    const parts = timeString.split(':');

    return {
      hour: Number(parts[0]) || 0,
      minute: Number(parts[1]) || 0,
      second: 0
    };
  }

  validateTime(): boolean {
    if (!this.fromTime || !this.toTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Required',
        text: 'Please select both From Time and To Time.',
        allowOutsideClick: false
      });
      return false;
    }

    const from = this.fromTime.hour * 60 + this.fromTime.minute;
    const to = this.toTime.hour * 60 + this.toTime.minute;

    if (from >= to) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Time',
        text: 'From Time must be less than To Time.',
        allowOutsideClick: false
      });
      return false;
    }

    return true;
  }

  Createsessions(): void {
    if (!this.validateTime()) {
      return;
    }

    const userId = Number(localStorage.getItem('id') || 0);

    const obj = {
      id: this.id,
      sessionName: this.sessionName,
      description: this.description,
      fromTime: this.getTimeString(this.fromTime),
      toTime: this.getTimeString(this.toTime),
      createdBy: userId,
      createdDate: new Date(),
      updatedBy: userId,
      updatedDate: new Date(),
      isActive: true
    };

    if (this.id === 0) {
      this._service.insertSession(obj).subscribe((res: any) => {
        if (res.isSuccess) {
          Swal.fire({
            title: 'Success',
            text: res.message,
            icon: 'success',
            allowOutsideClick: false
          });

          this.getAllsessions();
          this.isDisplay = false;
          this.isEditMode = false;
          this.reset();
        } else {
          Swal.fire({
            title: 'Error',
            text: res.message,
            icon: 'error',
            allowOutsideClick: false
          });
        }
      });
    } else {
      this._service.updateSession(obj).subscribe((res: any) => {
        if (res.isSuccess) {
          Swal.fire({
            title: 'Success',
            text: res.message,
            icon: 'success',
            allowOutsideClick: false
          });

          this.getAllsessions();
          this.isDisplay = false;
          this.isEditMode = false;
          this.reset();
        } else {
          Swal.fire({
            title: 'Error',
            text: res.message,
            icon: 'error',
            allowOutsideClick: false
          });
        }
      });
    }
  }

  getsessionsDetails(id: any): void {
    this._service.getSessionById(id).subscribe((arg: any) => {
      this.sessionValue = arg.data;

      this.id = this.sessionValue.id;
      this.sessionName = this.sessionValue.sessionName || '';
      this.description = this.sessionValue.description || '';
      this.fromTime = this.convertToTimeStruct(this.sessionValue.fromTime);
      this.toTime = this.convertToTimeStruct(this.sessionValue.toTime);

      this.isDisplay = true;
      this.resetButton = false;
      this.modeHeader = 'Edit session';
      this.isEditMode = true;
      this.closePickers();
    });
  }

 deletesessions(id: any): void {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    buttonsStyling: false,
    confirmButtonText: 'Yes, Delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary ml-1'
    },
    allowOutsideClick: false
  }).then((result) => {
    if (result.isConfirmed) {
      this._service.deleteSession(id).subscribe((response: any) => {
        if (response.isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: response.message,
            allowOutsideClick: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: response.message,
            allowOutsideClick: false
          });
        }

        this.getAllsessions();
      });
    }
  });
}
}