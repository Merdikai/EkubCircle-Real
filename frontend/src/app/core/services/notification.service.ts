import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { EkubNotification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private notificationsSignal = signal<EkubNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() =>
    this.notificationsSignal().filter(n => !n.isRead).length
  );

  getNotifications(unreadOnly?: boolean): Observable<EkubNotification[]> {
    const url = unreadOnly ? '/api/notifications?unreadOnly=true' : '/api/notifications';
    return this.http.get<EkubNotification[]>(url).pipe(
      tap(items => this.notificationsSignal.set(items))
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`/api/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.notificationsSignal.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      })
    );
  }
}
