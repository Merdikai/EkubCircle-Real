import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, CircleService, RoundService, PaymentService } from '../../core/services';
import { Circle, CurrentRound, CurrentRoundMember } from '../../core/models';
import { StatCardComponent, EtbCurrencyPipe, StatusBadgeComponent, ToastService } from '../../shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EtbCurrencyPipe, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private circleService = inject(CircleService);
  private roundService = inject(RoundService);
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);

  circles = signal<Circle[]>([]);
  selectedCircle = signal<Circle | null>(null);
  currentRound = signal<CurrentRound | null>(null);
  isLoading = signal<boolean>(true);
  isPaying = signal<boolean>(false);

  // Active circle list
  activeCircles = computed(() => this.circles().filter(c => c.status === 'Active'));
  formingCircles = computed(() => this.circles().filter(c => c.status === 'Forming'));
  completedCircles = computed(() => this.circles().filter(c => c.status === 'Completed'));

  // Current user's member record in the active round
  currentUserMember = computed<CurrentRoundMember | null>(() => {
    const round = this.currentRound();
    const user = this.authService.currentUser();
    if (!round?.members || !user) return null;
    return round.members.find(m => m.userId === user.id || m.email.toLowerCase() === user.email.toLowerCase()) ?? null;
  });

  // Has current user contributed for this round?
  hasCurrentUserPaid = computed<boolean>(() => {
    const m = this.currentUserMember();
    return m?.hasPaidThisRound ?? false;
  });

  // Has current user received their pot payout?
  hasCurrentUserReceived = computed<boolean>(() => {
    const m = this.currentUserMember();
    return m?.hasReceived ?? false;
  });

  // Total saved metric across all circles
  totalSavedAcrossCircles = computed(() => {
    return this.circles().reduce((sum, c) => sum + (c.totalSaved ?? (c.contributionAmount * (c.memberCount ?? 1))), 0);
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.circleService.getCircles().subscribe({
      next: (list) => {
        this.circles.set(list);
        
        // Prefer an active circle, or fallback to first circle
        const active = list.find(c => c.status === 'Active') || list[0] || null;
        this.selectedCircle.set(active);

        if (active && active.status === 'Active') {
          this.loadRoundForCircle(active.id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadRoundForCircle(circleId: number): void {
    this.roundService.getCurrentRound(circleId).subscribe({
      next: (r) => {
        this.currentRound.set(r);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSelectCircle(circle: Circle): void {
    this.selectedCircle.set(circle);
    if (circle.status === 'Active') {
      this.loadRoundForCircle(circle.id);
    } else {
      this.currentRound.set(null);
    }
  }

  // Quick One-Click Pay for the Logged-In Member
  payMyContribution(): void {
    const c = this.selectedCircle();
    const r = this.currentRound();
    const m = this.currentUserMember();

    if (!c || !r || !m) {
      this.toastService.warning('Action Blocked', 'You must be a registered member of this active round to contribute.');
      return;
    }

    if (m.hasPaidThisRound) {
      this.toastService.info('Already Paid', 'You have already paid your contribution for this round.');
      return;
    }

    this.isPaying.set(true);
    const roundId = r.roundId || r.id || 0;

    this.paymentService.recordPayment({
      circleId: c.id,
      roundId: roundId,
      memberId: m.memberId,
      circleMemberId: m.memberId,
      amount: c.contributionAmount,
      paymentType: 'Normal'
    }).subscribe({
      next: (res) => {
        this.isPaying.set(false);
        this.toastService.success('Contribution Recorded', `ETB ${res.amount} contributed for Round #${r.roundNumber}!`);
        this.loadRoundForCircle(c.id);
      },
      error: (err) => {
        this.isPaying.set(false);
        this.toastService.error('Payment Error', err.error?.detail || err.error?.message || 'Could not record payment.');
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}
