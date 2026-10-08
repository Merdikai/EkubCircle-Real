import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent]
    }).compileComponents();
  });

  it('should display the label, value, and subtext via signal inputs', async () => {
    const fixture = TestBed.createComponent(StatCardComponent);

    // Set signal-based required inputs
    fixture.componentRef.setInput('label', 'Total Saved');
    fixture.componentRef.setInput('value', '75,000 ETB');
    fixture.componentRef.setInput('subtext', 'Across 3 Active Circles');
    fixture.componentRef.setInput('theme', 'burgundy');

    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total Saved');
    expect(el.textContent).toContain('75,000 ETB');
    expect(el.textContent).toContain('Across 3 Active Circles');

    const card = el.querySelector('.stat-card');
    expect(card?.classList.contains('theme-burgundy')).toBe(true);
  });

  it('should reactively update when signal inputs change', async () => {
    const fixture = TestBed.createComponent(StatCardComponent);

    fixture.componentRef.setInput('label', 'Available Balance');
    fixture.componentRef.setInput('value', '12,500 ETB');
    fixture.componentRef.setInput('theme', 'blue');

    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('12,500 ETB');

    // Update value signal
    fixture.componentRef.setInput('value', '25,000 ETB');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.textContent).toContain('25,000 ETB');
  });
});
