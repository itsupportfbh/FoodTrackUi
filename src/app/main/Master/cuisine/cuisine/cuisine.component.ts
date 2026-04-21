import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import * as feather from 'feather-icons';
import { CuisineService } from '../cuisine-service';

@Component({
  selector: 'app-cuisine',
  templateUrl: './cuisine.component.html',
  styleUrls: ['./cuisine.component.scss']
})
export class CuisineComponent implements OnInit {

   @ViewChild('addForm') addForm!: NgForm;

  cuisineList: any[] = [];
  cuisineName: string = '';
  description: string = '';
  isEditMode = false;
  selectedCuisine: any = null;
  public isDisplay = false;
  userId: any;

  constructor(private cuisineService: CuisineService) {
    this.userId = localStorage.getItem('id')||1;
  }

  ngOnInit(): void {
    this.loadCuisine();
  }

  ngAfterViewChecked(): void {
    setTimeout(() => {
      feather.replace();
    });
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  loadCuisine() {
    this.cuisineService.getAllCuisine().subscribe((res: any) => {
      this.cuisineList = res || [];
      setTimeout(() => feather.replace(), 0);
    });
  }

  createCuisine() {
    this.isDisplay = true;
    this.isEditMode = false;
    this.selectedCuisine = null;
    this.reset();
  }

  editCuisine(data: any) {
    this.isDisplay = true;
    this.isEditMode = true;
    this.selectedCuisine = data;
    this.cuisineName = data.cuisineName;
    this.description = data.description;
  }

  cancel() {
    this.isEditMode = false;
    this.isDisplay = false;
    this.selectedCuisine = null;
    this.reset();
  }

  reset() {
    this.cuisineName = '';
    this.description = '';
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill all required fields',
        confirmButtonText: 'OK',
        confirmButtonColor: '#7367F0'
      });
      return;
    }

    const payload = {
      id: this.isEditMode ? this.selectedCuisine.id : null,
      cuisineName: this.cuisineName,
      description: this.description,
      isActive: true,
      userId: this.userId
    };

    this.cuisineService.saveCuisine(payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Saved successfully',
          confirmButtonText: 'OK',
          showConfirmButton: false,
          timer: 1500,
          confirmButtonColor: '#7367F0'
        });
        this.loadCuisine();
        this.cancel();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error || 'Failed to save cuisine',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

 confirmdeleteCuisine(data: any) {
  Swal.fire({
    title: 'Confirm Delete',
    text: 'Are you sure you want to delete this cuisine?',
    icon: 'warning',
    showCancelButton: true,
    buttonsStyling: false,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary ml-1'
    },
    allowOutsideClick: false
  }).then((result) => {
    if (result.isConfirmed) {
      this.deleteCuisine(data);
    }
  });
}

deleteCuisine(item: any) {
  this.cuisineService.deleteCuisine(item.id, this.userId).subscribe({
    next: (res: any) => {
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: res.message || 'Cuisine deleted successfully',
        buttonsStyling: false,
        showConfirmButton: false,
        timer: 1500,
        customClass: {
          confirmButton: 'btn btn-success'
        },
        allowOutsideClick: false
      });
      this.loadCuisine();
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to delete cuisine',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-danger'
        },
        allowOutsideClick: false
      });
    }
  });
}

}


