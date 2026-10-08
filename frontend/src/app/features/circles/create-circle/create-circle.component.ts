import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CircleService, MemberService, AuthService } from '../../../core/services';
import { ToastService } from '../../../shared';

@Component({
  selector: 'app-create-circle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-circle.component.html',
  styleUrls: ['./create-circle.component.css']
})
export class CreateCircleComponent {
  private fb = inject(FormBuilder);
  private circleService = inject(CircleService);
  private memberService = inject(MemberService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  currentStep = signal<number>(1);
  isLoading = signal<boolean>(false);

  // Reactive form adhering to domain models
  circleForm: FormGroup;

  invitedMembers = signal<string[]>([]);
  newMemberInput = signal<string>('');

  constructor() {
    const user = this.authService.currentUser();
    const orgEmail = user?.email || 'organizer@ekub.local';
    this.invitedMembers.set([
      `${orgEmail} (Organizer)`,
      'member1@ekub.local',
      'member2@ekub.local'
    ]);

    this.circleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      contributionAmount: [1000, [Validators.required, Validators.min(100)]],
      targetAmount: [12000, [Validators.required, Validators.min(500)]],
      durationMonths: [12, [Validators.required]],
      meetingLabel: ['Every Sunday at 4:00 PM', [Validators.required]]
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      if (this.circleForm.invalid) {
        this.circleForm.markAllAsTouched();
        return;
      }
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      this.currentStep.set(3);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  addMember(): void {
    const val = this.newMemberInput().trim();
    if (val && !this.invitedMembers().includes(val)) {
      this.invitedMembers.update(list => [...list, val]);
      this.newMemberInput.set('');
    }
  }

  removeMember(index: number): void {
    if (index === 0) return; // Cannot remove organizer
    this.invitedMembers.update(list => list.filter((_, i) => i !== index));
  }

  submitCircle(): void {
    if (this.circleForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.circleForm.value;

    this.circleService.createCircle({
      name: formVal.name,
      contributionAmount: Number(formVal.contributionAmount),
      meetingLabel: formVal.meetingLabel,
      durationMonths: Number(formVal.durationMonths),
      targetAmount: Number(formVal.targetAmount)
    }).subscribe({
      next: (created) => {
        // Invite members added in step 2 (skipping organizer at index 0)
        const emailsToInvite = this.invitedMembers()
          .slice(1)
          .map(e => e.replace(/\s*\(.*?\)/, '').trim())
          .filter(e => e.length > 0);

        if (emailsToInvite.length > 0) {
          emailsToInvite.forEach(email => {
            this.memberService.addMember(created.id, { email }).subscribe({
              error: () => {}
            });
          });
        }

        this.isLoading.set(false);
        this.toastService.success('Circle Created', `"${created.name}" is now Forming! Invite members to start.`);
        this.router.navigate(['/circles', created.id]);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Creation Failed', 'Could not create circle. Please try again.');
      }
    });
  }
}
