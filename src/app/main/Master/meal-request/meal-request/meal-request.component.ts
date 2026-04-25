import { Component, OnInit } from '@angular/core';

interface LocationOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-meal-request',
  templateUrl: './meal-request.component.html',
  styleUrls: ['./meal-request.component.scss']
})
export class MealRequestComponent implements OnInit {
  fromDate = '';
  toDate = '';
  locationId: number | null = null;

  locations: LocationOption[] = [
    { id: 1, name: 'Main Cafeteria' },
    { id: 2, name: 'Level 1 Pantry' },
    { id: 3, name: 'Level 2 Dining Hall' },
    { id: 4, name: 'Outdoor Counter' }
  ];

  constructor() {}

  ngOnInit(): void {}

  onSubmit(): void {
    const payload = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      locationId: this.locationId
    };

    console.log('Meal request payload:', payload);
  }

  onCancel(): void {
    this.fromDate = '';
    this.toDate = '';
    this.locationId = null;
  }
}