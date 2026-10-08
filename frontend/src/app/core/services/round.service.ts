import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CurrentRound, RoundSummary, PayoutRoundResponse, DrawWinnerResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RoundService {
  private http = inject(HttpClient);

  getRounds(circleId: number): Observable<RoundSummary[]> {
    return this.http.get<RoundSummary[]>(`/api/circles/${circleId}/rounds`).pipe(
      map(rounds => rounds.map(r => ({
        ...r,
        id: r.roundId || r.id
      })))
    );
  }

  getCurrentRound(circleId: number): Observable<CurrentRound | null> {
    return this.http.get<CurrentRound | null>(`/api/circles/${circleId}/rounds/current`).pipe(
      map(round => {
        if (!round) return null;
        return {
          ...round,
          id: round.roundId || round.id,
          roundId: round.roundId || round.id,
          receiverName: round.receiverFullName || round.receiverName,
          potAmount: round.currentPotAmount ?? round.potAmount ?? 0,
          paidMembersCount: round.paidCount ?? round.paidMembersCount ?? 0,
          totalMembersCount: round.totalMembers ?? round.totalMembersCount ?? 0,
          isEligibleForPayout: round.isReadyForPayout ?? round.isEligibleForPayout ?? false
        };
      })
    );
  }

  payoutRound(roundId: number): Observable<PayoutRoundResponse> {
    return this.http.post<PayoutRoundResponse>(`/api/rounds/${roundId}/payout`, {});
  }

  drawWinner(roundId: number): Observable<DrawWinnerResponse> {
    return this.http.post<DrawWinnerResponse>(`/api/rounds/${roundId}/draw`, {});
  }
}
