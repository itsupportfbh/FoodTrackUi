import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestOverrideComponent } from './request-override.component';

describe('RequestOverrideComponent', () => {
  let component: RequestOverrideComponent;
  let fixture: ComponentFixture<RequestOverrideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestOverrideComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
