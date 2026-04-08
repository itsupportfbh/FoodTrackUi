import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentScannerActivityComponent } from './recent-scanner-activity.component';

describe('RecentScannerActivityComponent', () => {
  let component: RecentScannerActivityComponent;
  let fixture: ComponentFixture<RecentScannerActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecentScannerActivityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentScannerActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
