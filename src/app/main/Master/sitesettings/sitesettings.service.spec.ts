import { TestBed } from '@angular/core/testing';

import { SitesettingsService } from './sitesettings.service';

describe('SitesettingsService', () => {
  let service: SitesettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitesettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
