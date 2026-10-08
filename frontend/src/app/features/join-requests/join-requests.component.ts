import { Component, inject, signal, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CircleService, MemberService, AuthService } from '../../core/services';
import { Circle, JoinRequest } from '../../core/models';
import { StatusBadgeComponent, ToastService } from '../../shared';

@Component({
  selector: 'app-join-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  templateUrl: './join-requests.component.html',
  styleUrls: ['./join-requests.component.css']
})
export class JoinRequestsComponent implements OnInit {
  circleId = input<string>();

  private circleService = inject(CircleService);
  private memberService = inject(MemberService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  circle = signal<Circle | null>(null);
  circles = signal<Circle[]>([]);
  requests = signal<JoinRequest[]>([]);
  isLoading = signal<boolean>(true);

  // Invite Form (Wireframe Screen 5)
  selectedCircleId = signal<number | null>(null);
  inviteEmail = signal<string>('');
  inviteMessage = signal<string>('Would you like to join our Ekub?');
  isSubmittingInvite = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    const id = this.circleId() ? parseInt(this.circleId()!, 10) : undefined;

    // Load user's circles for invite dropdown
    this.circleService.getCircles().subscribe({
      next: (list) => {
        this.circles.set(list);
        if (id) {
          const found = list.find(c => c.id === id) || null;
          this.circle.set(found);
          this.selectedCircleId.set(id);
        } else if (list.length > 0) {
          this.selectedCircleId.set(list[0].id);
        }
      }
    });

    this.memberService.getJoinRequests(id).subscribe({
      next: (reqs) => {
        this.requests.set(reqs);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  sendInvite(): void {
    const cId = this.selectedCircleId();
    const email = this.inviteEmail().trim();

    if (!cId || !email) {
      this.toastService.warning('Validation', 'Please select a circle and enter a recipient email.');
      return;
    }

    this.isSubmittingInvite.set(true);
    this.memberService.createJoinRequest({
      circleId: cId,
      email: email,
      message: this.inviteMessage().trim() || 'Would you like to join our Ekub?'
    }).subscribe({
      next: (res) => {
        this.isSubmittingInvite.set(false);
        this.inviteEmail.set('');
        this.toastService.success('Invite Sent', `Invitation sent to ${email}!`);
        this.loadData();
      },
      error: (err) => {
        this.isSubmittingInvite.set(false);
        this.toastService.error('Failed', err.error?.detail || err.error?.message || 'Could not send invitation.');
      }
    });
  }

  accept(req: JoinRequest): void {
    this.memberService.reviewJoinRequest({ requestId: req.id, action: 'Accept' }).subscribe({
      next: () => {
        this.requests.update(list => list.filter(r => r.id !== req.id));
        this.toastService.success('Accepted', `${req.requestedUserName || req.user?.fullName || 'User'} has joined the circle!`);
      },
      error: (err) => {
        this.toastService.error('Action Failed', err.error?.detail || err.error?.message || 'Could not accept request.');
      }
    });
  }

  reject(req: JoinRequest): void {
    this.memberService.reviewJoinRequest({ requestId: req.id, action: 'Reject' }).subscribe({
      next: () => {
        this.requests.update(list => list.filter(r => r.id !== req.id));
        this.toastService.info('Declined', 'Join request was declined.');
      },
      error: (err) => {
        this.toastService.error('Action Failed', err.error?.detail || err.error?.message || 'Could not decline request.');
      }
    });
  }
}
