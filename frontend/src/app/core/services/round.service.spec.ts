import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { RoundService } from './round.service';

describe('RoundService (HTTP Mock Spec)', () => {
  let httpMock: HttpTestingController;
  let service: RoundService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RoundService]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(RoundService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getCurrentRound(circleId) issues GET and maps pot/member stats', async () => {
    const resultPromise = firstValueFrom(service.getCurrentRound(5));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/circles/5/rounds/current'));
    expect(req.request.method).toBe('GET');

    req.flush({
      roundId: 101,
      circleId: 5,
      roundNumber: 2,
      status: 'Open',
      receiverFullName: 'Solomon Desta',
      receiverMemberOrder: 2,
      currentPotAmount: 15000,
      targetPotAmount: 20000,
      paidCount: 3,
      totalMembers: 4,
      isReadyForPayout: false
    });

    const round = await resultPromise;
    expect(round).not.toBeNull();
    expect(round!.id).toBe(101);
    expect(round!.receiverName).toBe('Solomon Desta');
    expect(round!.potAmount).toBe(15000);
    expect(round!.paidMembersCount).toBe(3);
    expect(round!.totalMembersCount).toBe(4);
    expect(round!.isEligibleForPayout).toBe(false);
  });

  it('payoutRound(roundId) issues POST /api/rounds/{id}/payout', async () => {
    const resultPromise = firstValueFrom(service.payoutRound(101));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/rounds/101/payout'));
    expect(req.request.method).toBe('POST');

    req.flush({
      roundId: 101,
      circleId: 5,
      potAmount: 20000,
      receiverMemberId: 2,
      receiverFullName: 'Solomon Desta',
      roundStatus: 'PaidOut',
      nextRoundNumber: 3,
      allRoundsCompleted: false
    });

    const payout = await resultPromise;
    expect(payout.roundStatus).toBe('PaidOut');
    expect(payout.potAmount).toBe(20000);
    expect(payout.nextRoundNumber).toBe(3);
  });

  it('drawWinner(roundId) issues POST /api/rounds/{id}/draw', async () => {
    const resultPromise = firstValueFrom(service.drawWinner(102));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/rounds/102/draw'));
    expect(req.request.method).toBe('POST');

    req.flush({
      winnerMemberId: 7,
      winnerName: 'Abebe Bikila',
      eligibleCandidatesCount: 5,
      isFairDraw: true
    });

    const draw = await resultPromise;
    expect(draw.winnerMemberId).toBe(7);
    expect(draw.winnerName).toBe('Abebe Bikila');
    expect(draw.eligibleCandidatesCount).toBe(5);
  });
});
