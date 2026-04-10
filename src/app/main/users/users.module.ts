import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './users-list/users-list.component';
import { CreateUsersComponent } from './create-users/create-users.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreSidebarModule } from '@core/components';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';

const routes = [
      {
    path: 'users-list',
    component: UsersListComponent,
    data: { animation: 'listusers' }
  },
    {
    path: 'users-create',
    component: CreateUsersComponent,
    data: { animation: 'createusers' }
  },
 
]
@NgModule({
  declarations: [ 
    UsersListComponent,
    CreateUsersComponent
  ],
  imports: [
    CommonModule,
     RouterModule.forChild(routes),
     FormsModule,
     CoreSidebarModule,
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
export class UsersModule { }
