import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRgenerateComponent } from './qrgenerate.component';

describe('QRgenerateComponent', () => {
  let component: QRgenerateComponent;
  let fixture: ComponentFixture<QRgenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRgenerateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRgenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
