import { TestBed } from '@angular/core/testing';

import { MealRequestService } from './meal-request.service';

describe('MealRequestService', () => {
  let service: MealRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
