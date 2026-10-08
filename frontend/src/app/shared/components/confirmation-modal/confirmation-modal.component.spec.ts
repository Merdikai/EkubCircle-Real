import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent]
    }).compileComponents();
  });

  it('should render modal content when isOpen is true', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Start Ekub Circle');
    fixture.componentRef.setInput('message', 'Starting this circle will lock member order.');
    fixture.componentRef.setInput('confirmText', 'Start Circle');
    fixture.componentRef.setInput('variant', 'primary');

    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Start Ekub Circle');
    expect(el.textContent).toContain('Starting this circle will lock member order.');
    expect(el.textContent).toContain('Start Circle');
  });

  it('should not render modal backdrop or content when isOpen is false', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const modalBackdrop = el.querySelector('.modal-backdrop');
    expect(modalBackdrop).toBeNull();
  });

  it('should emit confirm event when confirm button is clicked', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Confirm Payout');
    fixture.componentRef.setInput('confirmText', 'Execute Payout');
    fixture.componentRef.setInput('variant', 'primary');

    fixture.detectChanges();
    await fixture.whenStable();

    let confirmedEmitted = false;
    component.confirm.subscribe(() => {
      confirmedEmitted = true;
    });

    const el = fixture.nativeElement as HTMLElement;
    const confirmButton = el.querySelector('.btn-primary') as HTMLButtonElement;
    expect(confirmButton).toBeTruthy();
    confirmButton.click();

    fixture.detectChanges();
    await fixture.whenStable();
    expect(confirmedEmitted).toBe(true);
  });

  it('should emit cancel event when cancel button is clicked', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Cancel Operation');
    fixture.componentRef.setInput('cancelText', 'Never mind');

    fixture.detectChanges();
    await fixture.whenStable();

    let cancelEmitted = false;
    component.cancel.subscribe(() => {
      cancelEmitted = true;
    });

    const el = fixture.nativeElement as HTMLElement;
    const cancelButton = el.querySelector('.btn-outline') as HTMLButtonElement;
    expect(cancelButton).toBeTruthy();
    cancelButton.click();

    fixture.detectChanges();
    await fixture.whenStable();
    expect(cancelEmitted).toBe(true);
  });
});
