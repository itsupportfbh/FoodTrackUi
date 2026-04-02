import { TestBed } from '@angular/core/testing';

import { TabSessionService } from './tab-session.service';

describe('TabSessionService', () => {
  let service: TabSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
