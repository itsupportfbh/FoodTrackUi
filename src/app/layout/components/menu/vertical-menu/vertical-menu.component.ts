import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { PerfectScrollbarDirective } from 'ngx-perfect-scrollbar';

import { CoreConfigService } from '@core/services/config.service';
import { CoreMenuService } from '@core/components/core-menu/core-menu.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import * as feather from 'feather-icons';

@Component({
  selector: 'vertical-menu',
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VerticalMenuComponent implements OnInit, OnDestroy {
  coreConfig: any;
  menu: any;
  isCollapsed: boolean = false;
  isScrolled: boolean = false;
  public isSupportExpanded = false;
  public isManualPopupOpen = false;

public manualLanguages = [
  {
    code: 'en',
    label: 'English',
    file: 'assets/docs/QRServe_English.pdf',
    name: 'QRServe_English.pdf'
  },
  {
    code: 'ta',
    label: 'Tamil',
    file: 'assets/docs/QRServe_Tamil.pdf',
    name: 'QRServe_Tamil.pdf'
  },
  {
    code: 'ms',
    label: 'Malay',
    file: 'assets/docs/QRServe_Malay.pdf',
    name: 'QRServe_Malay.pdf'
  },
  {
    code: 'bn',
    label: 'Bangladesh',
    file: 'assets/docs/QRServe_Bengali.pdf',
    name: 'QRServe_Bengali.pdf'
  },
  {
    code: 'zh',
    label: 'Chinese',
    file: 'assets/docs/QRServe_Chines.pdf',
    name: 'QRServe_Chines.pdf'
  }
];
  private _unsubscribeAll: Subject<any>;

  @ViewChild(PerfectScrollbarDirective, { static: false })
  directiveRef?: PerfectScrollbarDirective;

  constructor(
    private _coreConfigService: CoreConfigService,
    private _coreMenuService: CoreMenuService,
    private _coreSidebarService: CoreSidebarService,
    private _router: Router
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.coreConfig = config;
        this.isCollapsed = config?.layout?.menu?.collapsed ?? false;
      });

    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(() => {
        const menuSidebar = this._coreSidebarService.getSidebarRegistry('menu');

        if (menuSidebar && !this.isCollapsed) {
          menuSidebar.close();
        }

        this.isManualPopupOpen = false;

        setTimeout(() => {
          feather.replace();
        }, 100);
      });

    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        setTimeout(() => {
          if (this.directiveRef) {
            this.directiveRef.scrollToElement('.navigation .active', -180, 500);
          }
          feather.replace();
        }, 200);
      });

    this._coreMenuService.onMenuChanged
      .pipe(
        filter(value => value !== null),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(() => {
        this.menu = this._coreMenuService.getCurrentMenu();

        setTimeout(() => {
          feather.replace();
        }, 100);
      });

    setTimeout(() => {
      feather.replace();
    }, 200);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  onSidebarScroll(): void {
    if (this.directiveRef && this.directiveRef.position(true).y > 3) {
      this.isScrolled = true;
    } else {
      this.isScrolled = false;
    }
  }

  toggleSidebar(): void {
    this._coreSidebarService.getSidebarRegistry('menu').toggleOpen();
  }

toggleSidebarCollapsible(event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  this.isCollapsed = !this.isCollapsed;

  this._coreConfigService.setConfig(
    {
      layout: {
        menu: {
          collapsed: this.isCollapsed
        }
      }
    },
    { emitEvent: true }
  );

  if (this.isCollapsed) {
    this.isSupportExpanded = false;
    this.isManualPopupOpen = false;
  }

  setTimeout(() => {
    feather.replace();
  }, 100);
}

toggleSupportCard(event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  this.isSupportExpanded = !this.isSupportExpanded;

  setTimeout(() => {
    feather.replace();
  }, 100);
}

openManualPopup(event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  this.isManualPopupOpen = true;

  setTimeout(() => {
    feather.replace();
  }, 100);
}

closeManualPopup(): void {
  this.isManualPopupOpen = false;

  setTimeout(() => {
    feather.replace();
  }, 100);
}

downloadManual(filePath: string, fileName: string, event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  this.isManualPopupOpen = false;

  setTimeout(() => {
    feather.replace();
  }, 100);
}
}