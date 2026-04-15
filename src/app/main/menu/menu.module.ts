import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu-list/menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


const routes = [
  {
    path: 'menu',
    component: MenuComponent,
    data: { animation: 'companyMaster' }
  },

]
@NgModule({
  declarations: [MenuComponent,],
  imports: [
    CommonModule,
     RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule,
        NgxDatatableModule,
        FormsModule,
    NgSelectModule,
    NgbDropdownModule,
    NgbTooltipModule
  ]
})
export class MenuModule { }
