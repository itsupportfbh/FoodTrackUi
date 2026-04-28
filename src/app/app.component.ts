import { Component, Inject, OnDestroy, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { DOCUMENT, Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';

import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import * as Waves from 'node-waves';

import { CoreMenuService } from '@core/components/core-menu/core-menu.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CoreConfigService } from '@core/services/config.service';
import { CoreLoadingScreenService } from '@core/services/loading-screen.service';
import { CoreTranslationService } from '@core/services/translation.service';

import { locale as menuEnglish } from 'app/menu/i18n/en';
import { locale as menuFrench } from 'app/menu/i18n/fr';
import { locale as menuGerman } from 'app/menu/i18n/de';
import { locale as menuPortuguese } from 'app/menu/i18n/pt';
import { TabSessionService } from './services/tab-session.service';
import { AuthenticationService } from 'app/auth/service';
import { MenuRoleHelper } from 'app/menu/menu-role.helper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  coreConfig: any;
  menu: any;
  defaultLanguage: 'en';
  appLanguage: 'en';

  private _unsubscribeAll: Subject<any>;
  private currentMenuKey = '';
  private readonly maskedRouteStorageKey = 'foodtrack_internal_route';

private readonly lastRouteStorageKey = 'foodtrack_last_route';

  constructor(
    @Inject(DOCUMENT) private document: any,
    private _title: Title,
    private _renderer: Renderer2,
    private _elementRef: ElementRef,
    public _coreConfigService: CoreConfigService,
    private _coreSidebarService: CoreSidebarService,
    private _coreLoadingScreenService: CoreLoadingScreenService,
    private _coreMenuService: CoreMenuService,
    private _coreTranslationService: CoreTranslationService,
    private _translateService: TranslateService,
    private _router: Router,
    private _location: Location,
    private tabSessionService: TabSessionService,
    private _authenticationService: AuthenticationService
  ) {
    this._translateService.addLangs(['en', 'fr', 'de', 'pt']);
    this._translateService.setDefaultLang('en');

    this._coreTranslationService.translate(menuEnglish, menuFrench, menuGerman, menuPortuguese);
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.tabSessionService.initTabCheck();
    Waves.init();
    this.restoreMaskedRoute();
    this.maskBrowserUrl();

    this.loadMenuByRole();

    this._authenticationService.currentUser
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        this.loadMenuByRole();
      });

    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;

      const appLanguage = this.coreConfig.app.appLanguage || 'en';
      this._translateService.use(appLanguage);

      setTimeout(() => {
        this._translateService.setDefaultLang('en');
        this._translateService.setDefaultLang(appLanguage);
      });

      this._elementRef.nativeElement.classList.remove(
        'vertical-layout',
        'vertical-menu-modern',
        'horizontal-layout',
        'horizontal-menu'
      );

      if (this.coreConfig.layout.type === 'vertical') {
        this._elementRef.nativeElement.classList.add('vertical-layout', 'vertical-menu-modern');
      } else if (this.coreConfig.layout.type === 'horizontal') {
        this._elementRef.nativeElement.classList.add('horizontal-layout', 'horizontal-menu');
      }

      this._elementRef.nativeElement.classList.remove(
        'navbar-floating',
        'navbar-static',
        'navbar-sticky',
        'navbar-hidden'
      );

      if (this.coreConfig.layout.navbar.type === 'navbar-static-top') {
        this._elementRef.nativeElement.classList.add('navbar-static');
      } else if (this.coreConfig.layout.navbar.type === 'fixed-top') {
        this._elementRef.nativeElement.classList.add('navbar-sticky');
      } else if (this.coreConfig.layout.navbar.type === 'floating-nav') {
        this._elementRef.nativeElement.classList.add('navbar-floating');
      } else {
        this._elementRef.nativeElement.classList.add('navbar-hidden');
      }

      this._elementRef.nativeElement.classList.remove('footer-fixed', 'footer-static', 'footer-hidden');

      if (this.coreConfig.layout.footer.type === 'footer-sticky') {
        this._elementRef.nativeElement.classList.add('footer-fixed');
      } else if (this.coreConfig.layout.footer.type === 'footer-static') {
        this._elementRef.nativeElement.classList.add('footer-static');
      } else {
        this._elementRef.nativeElement.classList.add('footer-hidden');
      }

      if (
        this.coreConfig.layout.menu.hidden &&
        this.coreConfig.layout.navbar.hidden &&
        this.coreConfig.layout.footer.hidden
      ) {
        this._elementRef.nativeElement.classList.add('blank-page');
        this._renderer.setAttribute(
          this._elementRef.nativeElement.getElementsByClassName('app-content')[0],
          'style',
          'transition:none'
        );
      } else {
        this._elementRef.nativeElement.classList.remove('blank-page');

        setTimeout(() => {
          this._renderer.setAttribute(
            this._elementRef.nativeElement.getElementsByClassName('app-content')[0],
            'style',
            'transition:300ms ease all'
          );
        }, 0);

        if (this.coreConfig.layout.navbar.hidden) {
          this._elementRef.nativeElement.classList.add('navbar-hidden');
        }

        if (this.coreConfig.layout.menu.hidden) {
          this._renderer.setAttribute(this._elementRef.nativeElement, 'data-col', '1-column');
        } else {
          this._renderer.removeAttribute(this._elementRef.nativeElement, 'data-col');
        }

        if (this.coreConfig.layout.footer.hidden) {
          this._elementRef.nativeElement.classList.add('footer-hidden');
        }
      }

      if (this.coreConfig.layout.skin !== '' && this.coreConfig.layout.skin !== undefined) {
        this.document.body.classList.remove('default-layout', 'bordered-layout', 'dark-layout', 'semi-dark-layout');
        this.document.body.classList.add(this.coreConfig.layout.skin + '-layout');
      }
    });

    this._title.setTitle(this.coreConfig?.app?.appTitle || 'FoodTrack');
  }

private restoreMaskedRoute(): void {
  const savedInternalRoute =
    localStorage.getItem('last_valid_url') ||
    sessionStorage.getItem(this.maskedRouteStorageKey);

  if (savedInternalRoute && savedInternalRoute !== '/') {
    setTimeout(() => {
      if (this._router.url === '/' || this._router.url === '/dashboard') {
        this._router.navigateByUrl(savedInternalRoute, { replaceUrl: true });
      }
    }, 0);
  }
}

private maskBrowserUrl(): void {
  window.addEventListener('popstate', (event: PopStateEvent) => {
    const internalUrl =
      event.state?.internalUrl ||
      sessionStorage.getItem(this.maskedRouteStorageKey) ||
      localStorage.getItem('last_valid_url');

    if (internalUrl && internalUrl !== '/' && internalUrl !== this._router.url) {
      setTimeout(() => {
        this._router.navigateByUrl(internalUrl, { replaceUrl: true });
      }, 0);
    }
  });

  this._router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this._unsubscribeAll)
    )
    .subscribe((event: NavigationEnd) => {
      const actualUrl = event.urlAfterRedirects || event.url;

      if (
        actualUrl &&
        actualUrl !== '/' &&
        !actualUrl.includes('/dashboard') &&
        !actualUrl.includes('/pages/authentication/login-v2') &&
        !actualUrl.includes('/pages/miscellaneous/error') &&
        !actualUrl.includes('/error')
      ) {
        sessionStorage.setItem(this.maskedRouteStorageKey, actualUrl);
        localStorage.setItem('last_valid_url', actualUrl);
      }

      if (actualUrl && actualUrl !== '/') {
        window.history.replaceState(
          { internalUrl: actualUrl },
          '',
          '/'
        );
      }
    });
}

  private loadMenuByRole(): void {
    const roleId = this._authenticationService.getRoleId();
    const filteredMenu = MenuRoleHelper.getMenuByRole(roleId);

    this.menu = [...filteredMenu];

    const newMenuKey = `main-role-${roleId}-${new Date().getTime()}`;
    this.currentMenuKey = newMenuKey;

    this._coreMenuService.register(newMenuKey, this.menu);
    this._coreMenuService.setCurrentMenu(newMenuKey);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  toggleSidebar(key): void {
    this._coreSidebarService.getSidebarRegistry(key).toggleOpen();
  }
}
