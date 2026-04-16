import { TestBed } from '@angular/core/testing';

import { CuisinePriceService } from './cuisine-price.service';

describe('CuisinePriceService', () => {
  let service: CuisinePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuisinePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
