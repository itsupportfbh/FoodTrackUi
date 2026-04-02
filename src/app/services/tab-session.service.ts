import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TabSessionService {
  private readonly TAB_ID_KEY = 'app_tab_id';
  private readonly ACTIVE_TABS_KEY = 'active_app_tabs';
  private readonly UNLOAD_REGISTERED_KEY = 'tab_unload_registered';

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

    let currentTabId = sessionStorage.getItem(this.TAB_ID_KEY);
    const activeTabs = this.getActiveTabs();

    if (!currentTabId) {
      if (activeTabs.length > 0) {
        this.handleDuplicateTab();
        return;
      }

      currentTabId = this.generateTabId();
      sessionStorage.setItem(this.TAB_ID_KEY, currentTabId);
      this.addTabToRegistry(currentTabId);
      this.registerUnload(currentTabId);
      return;
    }

    if (!activeTabs.includes(currentTabId)) {
      this.addTabToRegistry(currentTabId);
    }

    this.registerUnload(currentTabId);
  }

  resetTabSession(): void {
    localStorage.removeItem(this.ACTIVE_TABS_KEY);
    sessionStorage.removeItem(this.TAB_ID_KEY);
    sessionStorage.removeItem(this.UNLOAD_REGISTERED_KEY);
  }

  clearCurrentTabSession(): void {
    const currentTabId = sessionStorage.getItem(this.TAB_ID_KEY);

    if (currentTabId) {
      this.removeTabFromRegistry(currentTabId);
    }

    sessionStorage.removeItem(this.TAB_ID_KEY);
    sessionStorage.removeItem(this.UNLOAD_REGISTERED_KEY);
  }

  private handleDuplicateTab(): void {
    this.clearAuthStorage();
    sessionStorage.removeItem(this.TAB_ID_KEY);
    sessionStorage.removeItem(this.UNLOAD_REGISTERED_KEY);

    this.router.navigateByUrl('/pages/authentication/login-v2');
  }

  private clearAuthStorage(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  private generateTabId(): string {
    return 'TAB-' + Math.random().toString(36).substring(2) + '-' + Date.now();
  }

  private getActiveTabs(): string[] {
    const raw = localStorage.getItem(this.ACTIVE_TABS_KEY);

    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setActiveTabs(tabIds: string[]): void {
    localStorage.setItem(this.ACTIVE_TABS_KEY, JSON.stringify(tabIds));
  }

  private addTabToRegistry(tabId: string): void {
    const activeTabs = this.getActiveTabs();

    if (!activeTabs.includes(tabId)) {
      activeTabs.push(tabId);
      this.setActiveTabs(activeTabs);
    }
  }

  private removeTabFromRegistry(tabId: string): void {
    const activeTabs = this.getActiveTabs().filter(id => id !== tabId);
    this.setActiveTabs(activeTabs);
  }

  private registerUnload(tabId: string): void {
    const alreadyRegistered = sessionStorage.getItem(this.UNLOAD_REGISTERED_KEY);

    if (alreadyRegistered === 'true') {
      return;
    }

    window.addEventListener('beforeunload', () => {
      this.removeTabFromRegistry(tabId);
    });

    sessionStorage.setItem(this.UNLOAD_REGISTERED_KEY, 'true');
  }
}