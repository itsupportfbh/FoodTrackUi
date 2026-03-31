import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { SitesettingsService } from './sitesettings.service';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-sitesettings',
  templateUrl: './sitesettings.component.html',
  styleUrls: ['./sitesettings.component.scss']
})
export class SitesettingsComponent implements OnInit, AfterViewInit {

  @ViewChild('addForm') addForm!: NgForm;

  isEditMode = false;
  isDisplay = false;
  siteSettingsList: any[] = [];

  breakfastCutOffTime: string = '';
  lunchCutOffTime: string = '';
  lateLunchCutOffTime: string = '';
  dinnerCutOffTime: string = '';
  lateDinnerCutOffTime: string = '';
  
  createdby:string='';
 CreatedDate: Date = new Date();
UpdatedDate: Date | null = null;
  selectedSiteSetting: any = null;
  userId: string | null = null;
  cronEmail: string|null=null;
  isListView: boolean = false;     // show list when View is clicked

  constructor(private sitesettingsService: SitesettingsService) {
    this.userId = localStorage.getItem('id');
  }

  ngOnInit(): void {
    // Load the list on component init
    //this.loadSiteSettings();
this.isDisplay = true;
  this.isEditMode = false;
  this.selectedSiteSetting = null;
  this.resetForm();


  }

  ngAfterViewInit(): void {
    // Replace Feather icons after view initialization
    feather.replace();
  }

  // -------------------
  // Load Site Settings
  // -------------------
  loadSiteSettings() {
    this.sitesettingsService.getAllSiteSettings().subscribe({
      next: (res: any) => {
        this.siteSettingsList = res || [];
        setTimeout(() => feather.replace(), 0); // Ensure icons are updated
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error || 'Failed to load site settings',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // -------------------
  // Create Mode
  // -------------------
  createSiteSettings() {
    this.isDisplay = true;
    this.isEditMode = false;
    this.selectedSiteSetting = null;
    this.resetForm();
  }

  // -------------------
  // Edit Mode
  // -------------------
  editSiteSettings(item: any) {
    this.isDisplay = true;
    this.isEditMode = true;
    this.selectedSiteSetting = item;

    this.breakfastCutOffTime = item.breakfastCutOffTime;
    this.lunchCutOffTime = item.lunchCutOffTime;
    this.lateLunchCutOffTime = item.lateLunchCutOffTime;
    this.dinnerCutOffTime = item.dinnerCutOffTime;
    this.lateDinnerCutOffTime = item.lateDinnerCutOffTime;
    this.UpdatedDate=item.updatedDate;
  }

  // -------------------
  // Cancel & Reset
  // -------------------
  cancel() {
    this.isDisplay = false;
    this.isEditMode = false;
    this.selectedSiteSetting = null;
    this.resetForm();
  }

  resetForm() {
    this.breakfastCutOffTime = '';
    this.lunchCutOffTime = '';
    this.lateLunchCutOffTime = '';
    this.dinnerCutOffTime = '';
    this.lateDinnerCutOffTime = '';
    //this.addForm?.resetForm(); // reset form state (touched/dirty)
      if (this.addForm) {
    this.addForm.resetForm(); // only reset if form exists
  }

  }


  showSiteSettingsList() {
  this.isListView = true;
  this.isDisplay = false;
  this.loadSiteSettings(); // load list from API
}

goBackToForm() {
  this.isListView = false;
  this.isDisplay = true;
  this.resetForm();
}
  // -------------------
  // Submit Form
  // -------------------
  onSubmit(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill all required fields',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0e3a4c'
      });
      return;
    }

    const payload = {
     id: this.isEditMode ? this.selectedSiteSetting?.id : 0,  // 0 for new record
    breakfastCutOffTime: this.breakfastCutOffTime || '',
    lunchCutOffTime: this.lunchCutOffTime || '',
    lateLunchCutOffTime: this.lateLunchCutOffTime || '',
    dinnerCutOffTime: this.dinnerCutOffTime || '',
    lateDinnerCutOffTime: this.lateDinnerCutOffTime || '',
    cronEmail: this.cronEmail || '',           // optional
    isActive: true,
    createdDate: this.isEditMode ? this.selectedSiteSetting?.createdDate : new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    createdBy: this.isEditMode ? this.selectedSiteSetting?.createdBy : Number(this.userId),
    updatedBy: Number(this.userId)
  };

    this.sitesettingsService.saveSiteSettings(payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Saved successfully',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0e3a4c'
        });
       // this.loadSiteSettings(); // reload updated list
       this.resetForm();
        //this.cancel();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error || 'Failed to save site settings',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

 deleteSitesettings(Id: number) {
  const payload = { id: Id, userId: this.userId };

    this.sitesettingsService.deleteSiteSettings(Id, this.userId).subscribe({
    next: (res) => {
      console.log('Deleted successfully', res);
      this.loadSiteSettings(); // refresh the list
    },
    error: (err) => {
      console.error('Delete failed', err);
    }
  });

}
}