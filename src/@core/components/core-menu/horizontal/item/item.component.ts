import { ChangeDetectorRef, Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CoreMenuItem } from '@core/types';

@Component({
  selector: '[core-menu-horizontal-item]',
  templateUrl: './item.component.html'
})
export class CoreMenuHorizontalItemComponent implements OnInit, OnDestroy {
  @Input()
  item: CoreMenuItem;

  currentUrl = '';
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _router: Router,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUrl = this._router.url;

    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects || event.url;
        this._changeDetectorRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  @HostBinding('class.menu-route-active')
  get isActive(): boolean {
    return this.matchesRoute(this.item, this.currentUrl);
  }

  private matchesRoute(item: CoreMenuItem, currentUrl: string): boolean {
    if (!item) {
      return false;
    }

    const normalizedCurrentUrl = this.normalizeUrl(currentUrl);
    const candidates = [item.url || '', ...(item.activeUrls || [])]
      .map(url => this.normalizeUrl(url))
      .filter(Boolean);

    return candidates.some(candidate => {
      if (item.exactMatch) {
        return normalizedCurrentUrl === candidate;
      }

      return (
        normalizedCurrentUrl === candidate ||
        normalizedCurrentUrl.startsWith(`${candidate}/`)
      );
    });
  }

  private normalizeUrl(url: string): string {
    const cleanUrl = (url || '').split('?')[0].split('#')[0].trim().toLowerCase();

    if (!cleanUrl) {
      return '';
    }

    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }
}
