import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import 'hammerjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';

import { CoreModule } from '@core/core.module';
import { CoreCommonModule } from '@core/common.module';
import { CoreSidebarModule, CoreThemeCustomizerModule } from '@core/components';

import { coreConfig } from 'app/app-config';

import { AppComponent } from 'app/app.component';
import { LayoutModule } from 'app/layout/layout.module';
import { SampleModule } from 'app/main/sample/sample.module';
import { AuthGuard } from 'app/auth/helpers/auth.guards';

const appRoutes: Routes = [
  {
    path: 'pages',
    loadChildren: () =>
      import('./main/pages/pages.module').then(m => m.PagesModule)
  },
  {
    path: 'catering',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/catering.module').then(m => m.CateringModule)
  },
  {
    path: 'master',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/Master/master.module').then(m => m.MasterModule)
  },
  {
    path: 'scanner',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/Scanner/scanner/scanner.module').then(m => m.ScannerModule)
  },
  {
    path: 'requestoverride',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/request-override/request-override.module').then(m => m.RequestOverrideModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'pages/miscellaneous/error'
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, {
      scrollPositionRestoration: 'enabled',
      relativeLinkResolution: 'legacy'
    }),
    TranslateModule.forRoot(),
    NgbModule,
    ToastrModule.forRoot(),
    CoreModule.forRoot(coreConfig),
    CoreCommonModule,
    CoreSidebarModule,
    CoreThemeCustomizerModule,
    LayoutModule,
    SampleModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}