import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface AppTabLock {
  ownerId: string;
  updatedAt: number;
}

interface RefreshMarker {
  ownerId: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class TabSessionService {
  private readonly OWNER_ID_KEY = 'app_owner_id';
  private readonly APP_LOCK_KEY = 'app_active_tab_lock';
  private readonly REFRESH_MARKER_KEY = 'app_refresh_marker';
  private readonly DUPLICATE_BLOCKED_KEY = 'duplicate_tab_blocked';

  private heartbeatTimer: any;
  private readonly LOCK_STALE_MS = 15000;
  private readonly REFRESH_GRACE_MS = 5000;

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

    const ownerId = this.getOrCreateOwnerId();
    const existingLock = this.getLock();
    const refreshMarker = this.getRefreshMarker();
    const isReload = this.isReload();

    // no lock -> allow
    if (!existingLock || this.isLockStale(existingLock)) {
      this.acquireLock(ownerId);
      return;
    }

    // same tab refresh -> allow
    if (
      existingLock.ownerId === ownerId &&
      (isReload || refreshMarker?.ownerId === ownerId)
    ) {
      this.acquireLock(ownerId);
      return;
    }

    // same owner without reload marker means duplicated tab
    if (existingLock.ownerId === ownerId) {
      this.handleDuplicateTab();
      return;
    }

    // different owner and active lock already exists -> copied url / new tab
    this.handleDuplicateTab();
  }

  activateCurrentTab(): void {
    const ownerId = this.getOrCreateOwnerId();
    this.acquireLock(ownerId);
  }

  clearSessionOnLogout(): void {
    const ownerId = sessionStorage.getItem(this.OWNER_ID_KEY);
    const existingLock = this.getLock();

    if (existingLock && ownerId && existingLock.ownerId === ownerId) {
      localStorage.removeItem(this.APP_LOCK_KEY);
    }

    localStorage.removeItem(this.REFRESH_MARKER_KEY);
    sessionStorage.removeItem(this.OWNER_ID_KEY);
    sessionStorage.removeItem(this.DUPLICATE_BLOCKED_KEY);

    this.stopHeartbeat();
  }

  isDuplicateBlocked(): boolean {
    return sessionStorage.getItem(this.DUPLICATE_BLOCKED_KEY) === 'true';
  }

  clearDuplicateBlockedFlag(): void {
    sessionStorage.removeItem(this.DUPLICATE_BLOCKED_KEY);
  }

  private getOrCreateOwnerId(): string {
    let ownerId = sessionStorage.getItem(this.OWNER_ID_KEY);

    if (!ownerId) {
      ownerId = this.generateId('OWNER');
      sessionStorage.setItem(this.OWNER_ID_KEY, ownerId);
    }

    return ownerId;
  }

  private acquireLock(ownerId: string): void {
    this.setLock(ownerId);
    this.clearRefreshMarker();
    this.registerUnload(ownerId);
    this.startHeartbeat(ownerId);
  }

  private startHeartbeat(ownerId: string): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      const currentLock = this.getLock();

      if (currentLock && currentLock.ownerId === ownerId) {
        this.setLock(ownerId);
      }
    }, 3000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
private handleDuplicateTab(): void {
  sessionStorage.setItem(this.DUPLICATE_BLOCKED_KEY, 'true');

  // duplicate tab la login force panna auth data clear
  // localStorage.removeItem('currentUser');
  // localStorage.removeItem('token');
  // localStorage.removeItem('role');

  // sessionStorage.removeItem('currentUser');
  // sessionStorage.removeItem('token');
  // sessionStorage.removeItem('role');

  this.stopHeartbeat();

  this.router.navigateByUrl('/pages/authentication/login-v2');
}
  private registerUnload(ownerId: string): void {
    window.onbeforeunload = () => {
      const existingLock = this.getLock();

      if (existingLock && existingLock.ownerId === ownerId) {
        this.setRefreshMarker(ownerId);

        // lock remove panna koodadhu
        // refresh same tab detect panna marker use ஆகும்
      }
    };
  }

  private setLock(ownerId: string): void {
    const lock: AppTabLock = {
      ownerId,
      updatedAt: Date.now()
    };

    localStorage.setItem(this.APP_LOCK_KEY, JSON.stringify(lock));
  }

  private getLock(): AppTabLock | null {
    const raw = localStorage.getItem(this.APP_LOCK_KEY);

    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private isLockStale(lock: AppTabLock): boolean {
    return Date.now() - lock.updatedAt > this.LOCK_STALE_MS;
  }

  private setRefreshMarker(ownerId: string): void {
    const marker: RefreshMarker = {
      ownerId,
      expiresAt: Date.now() + this.REFRESH_GRACE_MS
    };

    localStorage.setItem(this.REFRESH_MARKER_KEY, JSON.stringify(marker));
  }

  private getRefreshMarker(): RefreshMarker | null {
    const raw = localStorage.getItem(this.REFRESH_MARKER_KEY);

    try {
      const marker = raw ? JSON.parse(raw) : null;

      if (!marker) {
        return null;
      }

      if (Date.now() > marker.expiresAt) {
        localStorage.removeItem(this.REFRESH_MARKER_KEY);
        return null;
      }

      return marker;
    } catch {
      localStorage.removeItem(this.REFRESH_MARKER_KEY);
      return null;
    }
  }

  private clearRefreshMarker(): void {
    localStorage.removeItem(this.REFRESH_MARKER_KEY);
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