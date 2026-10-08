import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Circle, CreateCircleRequest, StartCircleResponse, Payment, CircleSummary } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CircleService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/circles';

  getCircles(): Observable<Circle[]> {
    return this.http.get<Circle[]>(this.baseUrl);
  }

  getCircleById(id: number): Observable<Circle> {
    return this.http.get<Circle>(`${this.baseUrl}/${id}`);
  }

  createCircle(request: CreateCircleRequest): Observable<Circle> {
    return this.http.post<Circle>(this.baseUrl, request);
  }

  startCircle(id: number): Observable<StartCircleResponse> {
    return this.http.post<StartCircleResponse>(`${this.baseUrl}/${id}/start`, {});
  }

  getCircleHistory(id: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/${id}/history`);
  }

  getCircleSummary(id: number): Observable<CircleSummary> {
    return this.http.get<CircleSummary>(`${this.baseUrl}/${id}/summary`);
  }
}
