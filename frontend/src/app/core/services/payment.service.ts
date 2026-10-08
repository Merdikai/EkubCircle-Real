import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, RecordPaymentRequest, PaymentHistoryFilter } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);

  recordPayment(request: RecordPaymentRequest): Observable<Payment> {
    const memberId = request.memberId || request.circleMemberId || 0;
    const payload = {
      roundId: request.roundId,
      memberId: memberId,
      circleMemberId: memberId,
      amount: request.amount,
      paymentMethod: request.paymentMethod || 'Cash',
      notes: request.notes || null,
      isLate: request.isLate || false
    };
    return this.http.post<Payment>(`/api/rounds/${request.roundId}/payments`, payload);
  }

  getPayments(filter?: PaymentHistoryFilter): Observable<Payment[]> {
    if (filter?.circleId) {
      return this.http.get<Payment[]>(`/api/circles/${filter.circleId}/history`);
    }
    
    let params = new HttpParams();
    if (filter?.roundId) {
      params = params.set('roundId', filter.roundId.toString());
    }

    return this.http.get<Payment[]>('/api/payments', { params });
  }
}
