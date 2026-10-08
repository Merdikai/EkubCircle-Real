import { Component, inject, signal, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CircleService, MemberService, RoundService, AuthService } from '../../../core/services';
import { Circle, CircleMember, Round } from '../../../core/models';
import { StatusBadgeComponent, EtbCurrencyPipe, ConfirmationModalComponent, ToastService } from '../../../shared';

@Component({
  selector: 'app-circle-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, EtbCurrencyPipe, ConfirmationModalComponent],
  templateUrl: './circle-overview.component.html',
  styleUrls: ['./circle-overview.component.css']
})
export class CircleOverviewComponent implements OnInit {
  circleId = input.required<string>();

  circleService = inject(CircleService);
  memberService = inject(MemberService);
  roundService = inject(RoundService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  circle = signal<Circle | null>(null);
  members = signal<CircleMember[]>([]);
  currentRound = signal<Round | null>(null);
  isLoading = signal<boolean>(true);

  // Start Circle Modal
  isStartModalOpen = signal<boolean>(false);
  isStarting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCircleData();
  }

  loadCircleData(): void {
    const id = parseInt(this.circleId(), 10);
    this.isLoading.set(true);

    this.circleService.getCircleById(id).subscribe({
      next: (c) => {
        this.circle.set(c);
        this.loadMembers(id);
        this.loadCurrentRound(id);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Error', 'Circle not found.');
      }
    });
  }

  loadMembers(id: number): void {
    this.memberService.getCircleMembers(id).subscribe({
      next: (m) => this.members.set(m)
    });
  }

  loadCurrentRound(id: number): void {
    this.roundService.getCurrentRound(id).subscribe({
      next: (r) => {
        this.currentRound.set(r);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openStartCircleModal(): void {
    this.isStartModalOpen.set(true);
  }

  closeStartCircleModal(): void {
    this.isStartModalOpen.set(false);
  }

  confirmStartCircle(): void {
    const c = this.circle();
    if (!c) return;

    if (this.members().length < 2) {
      this.toastService.warning('Cannot Start', 'An Ekub Circle must have at least 2 members before starting.');
      this.isStartModalOpen.set(false);
      return;
    }

    this.isStarting.set(true);
    this.circleService.startCircle(c.id).subscribe({
      next: (res) => {
        this.isStarting.set(false);
        this.isStartModalOpen.set(false);
        this.toastService.success('Circle Started!', res.message || 'Circle started successfully');
        this.loadCircleData();
      },
      error: (err) => {
        this.isStarting.set(false);
        this.toastService.error('Cannot Start Circle', err.error?.detail || 'Failed to start circle.');
      }
    });
  }
}
