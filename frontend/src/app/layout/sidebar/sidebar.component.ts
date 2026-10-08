import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  authService = inject(AuthService);

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
    { label: 'Ekub Circles', route: '/circles', icon: 'groups' },
    { label: 'Create Circle', route: '/circles/create', icon: 'add_circle' },
    { label: 'Join Requests', route: '/join-requests', icon: 'receipt_long' },
    { label: 'Notifications', route: '/notifications', icon: 'redeem' }
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (item.route === '/circles/create') {
        return this.authService.isOrganizer();
      }
      return true;
    });
  }
}
