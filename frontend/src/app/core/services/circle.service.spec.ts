import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { CircleService } from './circle.service';
import { CreateCircleRequest } from '../models';

describe('CircleService (HTTP Mock Spec)', () => {
  let httpMock: HttpTestingController;
  let service: CircleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CircleService]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CircleService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getCircles() issues GET /api/circles and maps the response', async () => {
    const resultPromise = firstValueFrom(service.getCircles());

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles'));
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 1,
        name: 'Addis Tech Ekub',
        status: 'Active',
        contributionAmount: 5000,
        meetingLabel: 'Monthly',
        targetAmount: 50000,
        memberCount: 10
      },
      {
        id: 2,
        name: 'Bole Family Savings',
        status: 'Forming',
        contributionAmount: 2000,
        meetingLabel: 'Weekly',
        targetAmount: 20000,
        memberCount: 5
      }
    ]);

    const circles = await resultPromise;
    expect(circles).toHaveLength(2);
    expect(circles[0].name).toBe('Addis Tech Ekub');
    expect(circles[1].status).toBe('Forming');
  });

  it('getCircleById(id) issues GET /api/circles/{id}', async () => {
    const resultPromise = firstValueFrom(service.getCircleById(10));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles/10'));
    expect(req.request.method).toBe('GET');

    req.flush({
      id: 10,
      name: 'Addis Community Circle',
      status: 'Active',
      contributionAmount: 3000,
      meetingLabel: 'Weekly',
      targetAmount: 30000
    });

    const circle = await resultPromise;
    expect(circle.id).toBe(10);
    expect(circle.name).toBe('Addis Community Circle');
  });

  it('createCircle(request) issues POST /api/circles with payload', async () => {
    const request: CreateCircleRequest = {
      name: 'New Hawassa Circle',
      contributionAmount: 4000,
      meetingLabel: 'Bi-Weekly'
    };

    const resultPromise = firstValueFrom(service.createCircle(request));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);

    req.flush({
      id: 99,
      ...request,
      status: 'Forming',
      memberCount: 1
    });

    const created = await resultPromise;
    expect(created.id).toBe(99);
    expect(created.name).toBe('New Hawassa Circle');
    expect(created.status).toBe('Forming');
  });

  it('startCircle(id) issues POST /api/circles/{id}/start', async () => {
    const resultPromise = firstValueFrom(service.startCircle(15));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles/15/start'));
    expect(req.request.method).toBe('POST');

    req.flush({
      circleId: 15,
      status: 'Active',
      totalRounds: 5,
      message: 'Circle started successfully'
    });

    const res = await resultPromise;
    expect(res.circleId).toBe(15);
    expect(res.status).toBe('Active');
    expect(res.totalRounds).toBe(5);
  });
});
