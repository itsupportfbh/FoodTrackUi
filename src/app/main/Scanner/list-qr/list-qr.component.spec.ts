import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListQRComponent } from './list-qr.component';

describe('ListQRComponent', () => {
  let component: ListQRComponent;
  let fixture: ComponentFixture<ListQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListQRComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
