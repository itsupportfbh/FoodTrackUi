import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuisineSessionPerformanceComponent } from './cuisine-session-performance.component';

describe('CuisineSessionPerformanceComponent', () => {
  let component: CuisineSessionPerformanceComponent;
  let fixture: ComponentFixture<CuisineSessionPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CuisineSessionPerformanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuisineSessionPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
