import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDemandComponent } from './session-demand.component';

describe('SessionDemandComponent', () => {
  let component: SessionDemandComponent;
  let fixture: ComponentFixture<SessionDemandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionDemandComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDemandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
