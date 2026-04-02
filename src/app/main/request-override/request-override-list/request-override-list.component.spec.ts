import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestOverrideListComponent } from './request-override-list.component';

describe('RequestOverrideListComponent', () => {
  let component: RequestOverrideListComponent;
  let fixture: ComponentFixture<RequestOverrideListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestOverrideListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestOverrideListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
