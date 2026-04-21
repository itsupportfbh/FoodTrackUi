import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as feather from 'feather-icons';
import { LocationService } from './location.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit,AfterViewInit, AfterViewChecked  {

  @ViewChild('addForm') addFormForm!: NgForm;
  public id = 0;

  isDisplay: boolean = false;
  modeHeader: string = 'Add locations';
  resetButton: boolean = true;
 rows: any[] = [];
  tempData: any;
  countryValue: any;
  isEditMode: boolean;
  customerName: string;
  locationValue: any;
  locationName: any;
  description: any;

  constructor(private _service : LocationService) { }

  ngOnInit(): void 
  {
    this.getAlllocations();
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngAfterViewChecked(): void {
    feather.replace();
  }

  // reset(form: NgForm) {
  //   form.resetForm();
  //   this.isDisplay = false;
  //   this.modeHeader = 'Add Country';
  // }

  saveMode() {
    console.log('Saved:');
  }

  cancel() {
    this.isDisplay = false;
    this.isEditMode = false;
  }

  createlocations() {
    this.isDisplay = true;
   
    this.modeHeader = 'Add Location';
    this.reset();
  }


    reset() {
    this.modeHeader = "Create Location";
    this.locationName = "";
    this.description = "";
    this.id = 0;
  }


   getAlllocations() {
    this._service.getLocation().subscribe((response: any) => {
      this.rows = response.data;
      this.tempData = this.rows;
    })
  }


  Createlocations(data: any) {
    debugger
   
  const obj = {
    id:this.id,
    locationname: this.locationName,
    description:this.description,
    createdBy: Number(localStorage.getItem('id') || 0),
    createdDate: new Date(),
    updatedBy: Number(localStorage.getItem('id') || 0),
    updatedDate: new Date(),
    isActive: true,
  };
 if(this.id == 0){
  this._service.insertLocation(obj).subscribe((res) => {
    if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: res.message,
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          allowOutsideClick: false
        });

      this.getAlllocations();
      this.isDisplay = false;
      this.isEditMode=false;
    }
  });
}
else{
   this._service.updateLocation(obj).subscribe((res) => {
    if (res.isSuccess) {
       Swal.fire({
          title: 'Success',
          text: res.message,
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          allowOutsideClick: false
        });

      this.getAlllocations();
      this.isDisplay = false;
      this.isEditMode=false;
    }
  });
}
}



  getlocationsDetails(id: any) {
    debugger
    this._service.getLocationById(id).subscribe((arg: any) => {
      this.locationValue = arg.data;
      this.id = this.locationValue.id;
      this.locationName = this.locationValue.locationName;
      this.description = this.locationValue.description;
      this.isDisplay = true;
      this.resetButton = false;
      this.modeHeader = "Edit locations";
      this.isEditMode = true;
    });
  }

deletelocations(id) {
  const _self = this;

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
  }).then(function (result) {
    if (result.isConfirmed) {
      _self._service.deleteLocation(id).subscribe((response: any) => {
        if (response.isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: response.message,
            allowOutsideClick: false,
            buttonsStyling: false,
            showConfirmButton: false,
            timer: 1500,
            customClass: {
              confirmButton: 'btn btn-success'
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: response.message,
            allowOutsideClick: false,
            buttonsStyling: false,
            customClass: {
              confirmButton: 'btn btn-danger'
            }
          });
        }

        _self.getAlllocations();
      });
    }
  });
}

}


