import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from './payment.service';
import { RecordPaymentRequest } from '../models';

describe('PaymentService (HTTP Mock Spec)', () => {
  let httpMock: HttpTestingController;
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PaymentService]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PaymentService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('recordPayment(request) issues POST /api/rounds/{roundId}/payments with payload', async () => {
    const request: RecordPaymentRequest = {
      roundId: 101,
      memberId: 5,
      amount: 2500,
      paymentMethod: 'Telebirr',
      notes: 'Ref: TB100234',
      isLate: false
    };

    const resultPromise = firstValueFrom(service.recordPayment(request));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/rounds/101/payments'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      roundId: 101,
      memberId: 5,
      circleMemberId: 5,
      amount: 2500,
      paymentMethod: 'Telebirr',
      notes: 'Ref: TB100234',
      isLate: false
    });

    req.flush({
      id: 501,
      roundId: 101,
      memberId: 5,
      amount: 2500,
      paymentMethod: 'Telebirr',
      status: 'Paid',
      paidAt: '2026-10-08T10:00:00Z'
    });

    const payment = await resultPromise;
    expect(payment.id).toBe(501);
    expect(payment.amount).toBe(2500);
    expect(payment.status).toBe('Paid');
  });

  it('getPayments(filter) with roundId issues GET /api/payments?roundId=...', async () => {
    const resultPromise = firstValueFrom(service.getPayments({ roundId: 101 }));

    const req = httpMock.expectOne(r => r.url === '/api/payments' && r.params.get('roundId') === '101');
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 501,
        roundId: 101,
        memberId: 5,
        memberName: 'Abeba Bikila',
        amount: 2500,
        status: 'Paid'
      }
    ]);

    const payments = await resultPromise;
    expect(payments).toHaveLength(1);
    expect(payments[0].memberName).toBe('Abeba Bikila');
  });

  it('getPayments(filter) with circleId issues GET /api/circles/{circleId}/history', async () => {
    const resultPromise = firstValueFrom(service.getPayments({ circleId: 12 }));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles/12/history'));
    expect(req.request.method).toBe('GET');

    req.flush([
      { id: 1, amount: 2500, status: 'Paid' },
      { id: 2, amount: 2500, status: 'Paid' }
    ]);

    const payments = await resultPromise;
    expect(payments).toHaveLength(2);
  });
});
