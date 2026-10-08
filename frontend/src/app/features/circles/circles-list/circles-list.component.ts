import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CircleService, AuthService } from '../../../core/services';
import { Circle } from '../../../core/models';
import { StatusBadgeComponent, EtbCurrencyPipe } from '../../../shared';

@Component({
  selector: 'app-circles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, EtbCurrencyPipe],
  templateUrl: './circles-list.component.html',
  styleUrls: ['./circles-list.component.css']
})
export class CirclesListComponent implements OnInit {
  private circleService = inject(CircleService);
  authService = inject(AuthService);

  circles = signal<Circle[]>([]);
  activeFilter = signal<'All' | 'Active' | 'Forming' | 'Completed'>('All');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);

  filteredCircles = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().trim().toLowerCase();
    return this.circles().filter(c => {
      const matchesFilter = f === 'All' || c.status === f;
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.meetingLabel && c.meetingLabel.toLowerCase().includes(q)) ||
        (c.createdByUserName && c.createdByUserName.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadCircles();
  }

  loadCircles(): void {
    this.isLoading.set(true);
    this.circleService.getCircles().subscribe({
      next: (list) => {
        this.circles.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(filter: 'All' | 'Active' | 'Forming' | 'Completed'): void {
    this.activeFilter.set(filter);
  }
}
