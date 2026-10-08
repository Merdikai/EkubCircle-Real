import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, DEMO_USERS, NotificationService } from '../../core/services';
import { User } from '../../core/models';
import { MobilePreviewModalComponent } from '../../shared/components';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MobilePreviewModalComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  showUserMenu = signal(false);
  showNotifications = signal(false);
  showMobilePreview = signal(false);
  demoUsers = DEMO_USERS;

  unreadCount = signal(1);

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
  }

  switchUser(user: User): void {
    this.authService.loginWithDemoUser(user).subscribe({
      next: () => {
        this.showUserMenu.set(false);
        this.router.navigate(['/dashboard']).then(() => {
          window.location.reload();
        });
      },
      error: () => {
        this.showUserMenu.set(false);
      }
    });
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
