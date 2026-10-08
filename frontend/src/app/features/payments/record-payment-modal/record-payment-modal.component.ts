import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, AuthService } from '../../../core/services';
import { Circle, Round, CircleMember } from '../../../core/models';
import { EtbCurrencyPipe, ToastService } from '../../../shared';

@Component({
  selector: 'app-record-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, EtbCurrencyPipe],
  templateUrl: './record-payment-modal.component.html',
  styleUrls: ['./record-payment-modal.component.css']
})
export class RecordPaymentModalComponent {
  isOpen = input<boolean>(false);
  circle = input.required<Circle>();
  round = input.required<Round>();
  members = input.required<CircleMember[]>();

  paymentCompleted = output<void>();
  close = output<void>();

  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  selectedMemberId = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);

  submit(): void {
    const memId = this.selectedMemberId();
    if (!memId) {
      this.toastService.warning('Validation', 'Please select a member.');
      return;
    }

    this.isSubmitting.set(true);

    const effectiveRoundId = this.round().roundId || this.round().id || 0;
    this.paymentService.recordPayment({
      circleId: this.circle().id,
      roundId: effectiveRoundId,
      memberId: memId,
      circleMemberId: memId,
      amount: this.circle().contributionAmount,
      paymentType: 'Normal'
    }).subscribe({
      next: (p) => {
        this.isSubmitting.set(false);
        this.toastService.success('Success', `Contribution of ETB ${p.amount} recorded!`);
        this.paymentCompleted.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail = err.error?.detail || 'Duplicate contribution rejected.';
        this.toastService.error('Rejected', detail);
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
