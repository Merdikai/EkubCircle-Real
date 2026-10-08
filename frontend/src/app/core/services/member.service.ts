import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CircleMember, AddMemberRequest, JoinRequest, ReviewJoinRequestDto, CreateJoinRequestDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private http = inject(HttpClient);

  getCircleMembers(circleId: number): Observable<CircleMember[]> {
    return this.http.get<CircleMember[]>(`/api/circles/${circleId}/members`);
  }

  addMember(circleId: number, request: AddMemberRequest): Observable<CircleMember> {
    const payload = {
      email: request.email || request.emailOrPhone || ''
    };
    return this.http.post<CircleMember>(`/api/circles/${circleId}/members`, payload);
  }

  removeMember(circleId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`/api/circles/${circleId}/members/${memberId}`);
  }

  getJoinRequests(circleId?: number): Observable<JoinRequest[]> {
    const url = circleId ? `/api/join-requests/circle/${circleId}` : '/api/join-requests/my';
    return this.http.get<JoinRequest[]>(url);
  }

  createJoinRequest(dto: CreateJoinRequestDto): Observable<JoinRequest> {
    return this.http.post<JoinRequest>('/api/join-requests', dto);
  }

  reviewJoinRequest(dto: ReviewJoinRequestDto): Observable<{ success: boolean; message: string }> {
    const action = dto.action.toLowerCase() === 'accept' ? 'accept' : 'reject';
    return this.http.post<{ success: boolean; message: string }>(`/api/join-requests/${dto.requestId}/${action}`, {});
  }
}
