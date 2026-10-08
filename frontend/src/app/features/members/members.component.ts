import { Component, inject, signal, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CircleService, MemberService, AuthService } from '../../core/services';
import { Circle, CircleMember, JoinRequest } from '../../core/models';
import { ToastService } from '../../shared';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  circleId = input.required<string>();

  private circleService = inject(CircleService);
  private memberService = inject(MemberService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  circle = signal<Circle | null>(null);
  members = signal<CircleMember[]>([]);
  joinRequests = signal<JoinRequest[]>([]);
  isLoading = signal<boolean>(true);

  // Add member modal/input (only in Forming status)
  newMemberEmail = signal<string>('');
  newMemberName = signal<string>('');
  isAdding = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const id = parseInt(this.circleId(), 10);
    this.isLoading.set(true);

    this.circleService.getCircleById(id).subscribe({
      next: (c) => {
        this.circle.set(c);
        this.loadMembers(id);
        this.loadJoinRequests(id);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadMembers(id: number): void {
    this.memberService.getCircleMembers(id).subscribe({
      next: (m) => {
        this.members.set(m);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadJoinRequests(id: number): void {
    this.memberService.getJoinRequests(id).subscribe({
      next: (reqs) => this.joinRequests.set(reqs)
    });
  }

  addMember(): void {
    const c = this.circle();
    if (!c) return;

    // NON-NEGOTIABLE RULE: Cannot add members after circle has started
    if (c.status !== 'Forming') {
      this.toastService.error('Action Blocked', 'Member list is locked. Cannot add members after circle has started.');
      return;
    }

    const email = this.newMemberEmail().trim();
    if (!email) {
      this.toastService.warning('Validation', 'Please enter a valid email or phone number.');
      return;
    }

    this.isAdding.set(true);
    this.memberService.addMember(c.id, {
      email: email
    }).subscribe({
      next: (newM) => {
        this.isAdding.set(false);
        this.members.update(list => [...list, newM]);
        this.newMemberEmail.set('');
        this.newMemberName.set('');
        this.toastService.success('Member Added', `${newM.fullName} added as Member #${newM.memberOrder}`);
      },
      error: (err) => {
        this.isAdding.set(false);
        this.toastService.error('Failed', err.error?.detail || err.error?.message || 'Could not add member.');
      }
    });
  }

  removeMember(memberId: number): void {
    const c = this.circle();
    if (!c) return;

    if (c.status !== 'Forming') {
      this.toastService.error('Action Blocked', 'Cannot remove members after circle has started.');
      return;
    }

    this.memberService.removeMember(c.id, memberId).subscribe({
      next: () => {
        this.members.update(list => list.filter(m => m.id !== memberId));
        this.toastService.success('Member Removed', 'Member was removed from the circle.');
      },
      error: (err) => {
        this.toastService.error('Failed', err.error?.detail || err.error?.message || 'Could not remove member.');
      }
    });
  }

  acceptJoinRequest(req: JoinRequest): void {
    const c = this.circle();
    if (!c) return;

    if (c.status !== 'Forming') {
      this.toastService.error('Action Blocked', 'Cannot accept requests after circle has started.');
      return;
    }

    this.memberService.reviewJoinRequest({ requestId: req.id, action: 'Accept' }).subscribe({
      next: () => {
        this.joinRequests.update(list => list.filter(r => r.id !== req.id));
        this.toastService.success('Request Accepted', `${req.user?.fullName || 'User'} has joined the circle!`);
        this.loadMembers(c.id);
      }
    });
  }

  rejectJoinRequest(req: JoinRequest): void {
    this.memberService.reviewJoinRequest({ requestId: req.id, action: 'Reject' }).subscribe({
      next: () => {
        this.joinRequests.update(list => list.filter(r => r.id !== req.id));
        this.toastService.info('Request Rejected', 'Join request was declined.');
      }
    });
  }
}
