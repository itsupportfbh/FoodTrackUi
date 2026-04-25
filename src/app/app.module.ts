import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

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
import { AuthInterceptor } from './auth/service/auth.interceptor';
import { ErrorComponent } from 'app/main/pages/miscellaneous/error/error.component';

const appRoutes: Routes = [
  {
    path: 'error',
    component: ErrorComponent
  },
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
    path: 'menu',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/menu/menu.module').then(m => m.MenuModule)
  },
      {
    path: 'meal',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/Master/meal-request/meal-request.module').then(m => m.MealRequestModule)
  },
  {
    path: 'requestoverride',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/request-override/request-override.module').then(
        m => m.RequestOverrideModule
      )
  },
    {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/users/users.module').then(
        m => m.UsersModule
      )
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./main/dashboard/dashboard.module').then(m => m.DashboardModule),
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'error'
  }
];

@NgModule({
  declarations: [AppComponent, ErrorComponent],
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
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
