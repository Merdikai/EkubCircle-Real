import { Component, inject, signal, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircleService } from '../../../core/services';
import { CircleSummary } from '../../../core/models';
import { StatusBadgeComponent, EtbCurrencyPipe } from '../../../shared';

@Component({
  selector: 'app-circle-summary',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, EtbCurrencyPipe],
  templateUrl: './circle-summary.component.html',
  styleUrls: ['./circle-summary.component.css']
})
export class CircleSummaryComponent implements OnInit {
  circleId = input.required<string>();

  private circleService = inject(CircleService);

  summary = signal<CircleSummary | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    const id = parseInt(this.circleId(), 10);
    this.isLoading.set(true);

    this.circleService.getCircleSummary(id).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
