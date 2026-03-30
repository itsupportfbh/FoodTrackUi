import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SessionService } from './session.service';
import * as feather from 'feather-icons';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit ,AfterViewInit, AfterViewChecked {

  @ViewChild('addForm') addFormForm!: NgForm;
  public id = 0;

  isDisplay: boolean = false;
  modeHeader: string = 'Add sessions';
  resetButton: boolean = true;
 rows: any[] = [];
  tempData: any;
  countryValue: any;
  isEditMode: boolean;
  customerName: string;
  sessionValue: any;
  sessionName: any;
  description: any;

  constructor(private _service : SessionService) { }

  ngOnInit(): void 
  {
    this.getAllsessions();
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

  createsessions() {
    this.isDisplay = true;
   
    this.modeHeader = 'Add session';
    this.reset();
  }


    reset() {
    this.modeHeader = "Create session";
    this.sessionName = "";
    this.description = "";
    this.id = 0;
  }


   getAllsessions() {
    this._service.getSession().subscribe((response: any) => {
      this.rows = response.data;
      this.tempData = this.rows;
    })
  }


  Createsessions(data: any) {
    debugger
   
  const obj = {
    id:this.id,
    sessionname: this.sessionName,
    description:this.description,
    createdBy: Number(localStorage.getItem('id') || 0),
    createdDate: new Date(),
    updatedBy: Number(localStorage.getItem('id') || 0),
    updatedDate: new Date(),
    isActive: true,
  };
 if(this.id == 0){
  this._service.insertSession(obj).subscribe((res) => {
    if (res.isSuccess) {
      Swal.fire({
        title: "Hi",
        text: res.message,
        icon: "success",
        allowOutsideClick: false,
      });

      this.getAllsessions();
      this.isDisplay = false;
      this.isEditMode=false;
    }
  });
}
else{
   this._service.updateSession(obj).subscribe((res) => {
    if (res.isSuccess) {
      Swal.fire({
        title: "Hi",
        text: res.message,
        icon: "success",
        allowOutsideClick: false,
      });

      this.getAllsessions();
      this.isDisplay = false;
      this.isEditMode=false;
    }
  });
}
}



  getsessionsDetails(id: any) {
    debugger
    this._service.getSessionById(id).subscribe((arg: any) => {
      this.sessionValue = arg.data;
      this.id = this.sessionValue.id;
      this.sessionName = this.sessionValue.sessionName;
      this.description = this.sessionValue.description;
      this.isDisplay = true;
      this.resetButton = false;
      this.modeHeader = "Edit sessions";
      this.isEditMode = true;
    });
  }

  deletesessions(id) {
    const _self = this;
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#7367F0",
      cancelButtonColor: "#E42728",
      confirmButtonText: "Yes, Delete it!",
      customClass: {
        confirmButton: "btn btn-primary",
        cancelButton: "btn btn-danger ml-1",
      },
      allowOutsideClick: false,
    }).then(function (result) {
      if (result.value) {
        _self._service.deleteSession(id).subscribe((response: any) => {
          if (response.isSuccess) {
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: response.message,
              allowOutsideClick: false,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: response.message,
              allowOutsideClick: false,
            });
          }
          _self.getAllsessions();
        });
      }
    });
  }

}

