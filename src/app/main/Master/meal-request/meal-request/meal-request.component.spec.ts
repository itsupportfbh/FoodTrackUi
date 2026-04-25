import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealRequestComponent } from './meal-request.component';

describe('MealRequestComponent', () => {
  let component: MealRequestComponent;
  let fixture: ComponentFixture<MealRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MealRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
