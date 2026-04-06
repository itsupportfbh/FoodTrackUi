import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TabSessionService {
  private readonly TAB_ID_KEY = 'app_tab_id';
  private readonly INSTANCE_ID_KEY = 'app_instance_id';
  private readonly APP_LOCK_KEY = 'app_active_tab_lock';
  private readonly DUPLICATE_BLOCKED_KEY = 'duplicate_tab_blocked';

  constructor(private router: Router) {}

  initTabCheck(): void {
    const currentPath = window.location.pathname;

    if (
      currentPath.includes('/pages/authentication/login-v2') ||
      currentPath.includes('/pages/miscellaneous/error') ||
      currentPath.includes('/pages/miscellaneous/not-authorized')
    ) {
      return;
    }

    let tabId = sessionStorage.getItem(this.TAB_ID_KEY);
    if (!tabId) {
      tabId = this.generateId('TAB');
      sessionStorage.setItem(this.TAB_ID_KEY, tabId);
    }

    // every page load gets unique instance id
    const instanceId = this.generateId('INSTANCE');
    sessionStorage.setItem(this.INSTANCE_ID_KEY, instanceId);

    const isReload = this.isReload();
    const existingLock = this.getLock();

    // no lock -> acquire
    if (!existingLock) {
      this.setLock(tabId, instanceId);
      this.registerUnload(tabId, instanceId);
      return;
    }

    // same tab refresh -> allow and replace old instance id
    if (isReload && existingLock.tabId === tabId) {
      this.setLock(tabId, instanceId);
      this.registerUnload(tabId, instanceId);
      return;
    }

    // any other case = duplicate / copied url / duplicated tab
    if (existingLock.tabId !== tabId || existingLock.instanceId !== instanceId) {
      this.handleDuplicateTab();
      return;
    }

    this.setLock(tabId, instanceId);
    this.registerUnload(tabId, instanceId);
  }

  resetTabSession(): void {
    const tabId = sessionStorage.getItem(this.TAB_ID_KEY);
    const instanceId = sessionStorage.getItem(this.INSTANCE_ID_KEY);

    if (tabId && instanceId) {
      const lock = this.getLock();
      if (lock && lock.tabId === tabId && lock.instanceId === instanceId) {
        localStorage.removeItem(this.APP_LOCK_KEY);
      }
    }

    sessionStorage.removeItem(this.TAB_ID_KEY);
    sessionStorage.removeItem(this.INSTANCE_ID_KEY);
    sessionStorage.removeItem(this.DUPLICATE_BLOCKED_KEY);
  }

  isDuplicateBlocked(): boolean {
    return sessionStorage.getItem(this.DUPLICATE_BLOCKED_KEY) === 'true';
  }

  clearDuplicateBlockedFlag(): void {
    sessionStorage.removeItem(this.DUPLICATE_BLOCKED_KEY);
  }

  private handleDuplicateTab(): void {
    sessionStorage.setItem(this.DUPLICATE_BLOCKED_KEY, 'true');
    this.router.navigateByUrl('/pages/authentication/login-v2');
  }

  private registerUnload(tabId: string, instanceId: string): void {
    window.onbeforeunload = () => {
      const lock = this.getLock();
      if (lock && lock.tabId === tabId && lock.instanceId === instanceId) {
        localStorage.removeItem(this.APP_LOCK_KEY);
      }
    };
  }

  private setLock(tabId: string, instanceId: string): void {
    localStorage.setItem(
      this.APP_LOCK_KEY,
      JSON.stringify({
        tabId,
        instanceId,
        updatedAt: Date.now()
      })
    );
  }

  private getLock(): { tabId: string; instanceId: string; updatedAt: number } | null {
    const raw = localStorage.getItem(this.APP_LOCK_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substring(2)}-${Date.now()}`;
  }

  private isReload(): boolean {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === 'reload';
    }

    const legacyNav = (performance as any).navigation;
    if (legacyNav) {
      return legacyNav.type === 1;
    }

    return false;
  }
}