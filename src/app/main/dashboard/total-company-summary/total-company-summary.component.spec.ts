import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalCompanySummaryComponent } from './total-company-summary.component';

describe('TotalCompanySummaryComponent', () => {
  let component: TotalCompanySummaryComponent;
  let fixture: ComponentFixture<TotalCompanySummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TotalCompanySummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalCompanySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
