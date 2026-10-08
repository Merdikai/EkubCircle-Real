import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, DEMO_USERS, NotificationService } from '../../core/services';
import { User, EkubNotification } from '../../core/models';
import { MobilePreviewModalComponent } from '../../shared/components';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MobilePreviewModalComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  showUserMenu = signal(false);
  showNotifications = signal(false);
  showMobilePreview = signal(false);
  demoUsers = DEMO_USERS;

  unreadCount = this.notificationService.unreadCount;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.notificationService.getNotifications().subscribe();
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
    if (this.showNotifications()) {
      this.notificationService.getNotifications().subscribe();
    }
  }

  markAsRead(item: EkubNotification): void {
    if (item.isRead) return;
    this.notificationService.markAsRead(item.id).subscribe();
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
