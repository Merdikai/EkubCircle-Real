import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { CirclesListComponent } from './circles-list.component';
import { CircleService } from '../../../core/services/circle.service';
import { Circle } from '../../../core/models';

describe('CirclesListComponent', () => {
  const mockCircles: Circle[] = [
    {
      id: 1,
      name: 'Addis Tech Ekub',
      status: 'Active',
      contributionAmount: 5000,
      meetingLabel: 'Monthly',
      targetAmount: 50000,
      memberCount: 10,
      createdByUserId: 1,
      createdByUserName: 'organizer@ekub.local',
      createdAt: '2026-10-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Bole Family Savings',
      status: 'Forming',
      contributionAmount: 2000,
      meetingLabel: 'Weekly',
      targetAmount: 20000,
      memberCount: 5,
      createdByUserId: 1,
      createdByUserName: 'organizer@ekub.local',
      createdAt: '2026-10-02T00:00:00Z'
    },
    {
      id: 3,
      name: 'Merkato Traders Group',
      status: 'Completed',
      contributionAmount: 10000,
      meetingLabel: 'Monthly',
      targetAmount: 120000,
      memberCount: 12,
      createdByUserId: 2,
      createdByUserName: 'member1@ekub.local',
      createdAt: '2026-10-03T00:00:00Z'
    }
  ];

  let fakeCircleService: Partial<CircleService>;

  beforeEach(async () => {
    fakeCircleService = {
      getCircles: () => of(mockCircles)
    };

    await TestBed.configureTestingModule({
      imports: [CirclesListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CircleService, useValue: fakeCircleService }
      ]
    }).compileComponents();
  });

  it('should initialize and load circles via signal state', async () => {
    const fixture = TestBed.createComponent(CirclesListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.circles()).toHaveLength(3);
    expect(component.isLoading()).toBe(false);
    expect(component.filteredCircles()).toHaveLength(3);
  });

  it('should filter circles reactively by status using activeFilter signal', async () => {
    const fixture = TestBed.createComponent(CirclesListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Default filter is 'All'
    expect(component.filteredCircles()).toHaveLength(3);

    // Switch filter to 'Active'
    component.setFilter('Active');
    expect(component.filteredCircles()).toHaveLength(1);
    expect(component.filteredCircles()[0].name).toBe('Addis Tech Ekub');

    // Switch filter to 'Forming'
    component.setFilter('Forming');
    expect(component.filteredCircles()).toHaveLength(1);
    expect(component.filteredCircles()[0].name).toBe('Bole Family Savings');

    // Switch filter to 'Completed'
    component.setFilter('Completed');
    expect(component.filteredCircles()).toHaveLength(1);
    expect(component.filteredCircles()[0].name).toBe('Merkato Traders Group');
  });

  it('should filter circles reactively by search query signal', async () => {
    const fixture = TestBed.createComponent(CirclesListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.searchQuery.set('bole');
    expect(component.filteredCircles()).toHaveLength(1);
    expect(component.filteredCircles()[0].name).toBe('Bole Family Savings');

    component.searchQuery.set('');
    expect(component.filteredCircles()).toHaveLength(3);
  });
});
