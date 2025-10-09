    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { interval, Observable } from 'rxjs';
    import { switchMap, map, startWith } from 'rxjs/operators';

    @Injectable({
      providedIn: 'root'
    })
    export class PollingService {
      constructor(private http: HttpClient) {}

      pollData<T>(url: string, intervalMs: number): Observable<T> {
        return interval(intervalMs).pipe(
          startWith(0), // Emit immediately on subscription
          switchMap(() => this.http.get<T>(url)),
          map(response => response) // Or transform the response as needed
        );
      }
    }
