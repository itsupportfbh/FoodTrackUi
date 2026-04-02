import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { CoreCommonModule } from '@core/common.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'authentication/login-v2',
    pathMatch: 'full'
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./authentication/authentication.module').then(m => m.AuthenticationModule)
  },
  {
    path: 'miscellaneous',
    loadChildren: () =>
      import('./miscellaneous/miscellaneous.module').then(m => m.MiscellaneousModule)
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CoreCommonModule,
    ContentHeaderModule,
    NgbModule,
    NgSelectModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class PagesModule {}