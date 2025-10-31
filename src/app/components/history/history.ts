import { Component, inject, OnInit, Optional, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { retry, takeWhile, timeout } from 'rxjs';
import { PollingService } from '../../polling-service';
import { App } from '../../app';

@Component({
  selector: 'app-history',
  templateUrl: './history.html'
})
export class HistoryComponent implements OnInit{
  constructor(@Optional() public app: App) {}
  private router = inject(Router);
  private http = inject(HttpClient);
  private polling = inject(PollingService);
  protected readonly title = signal('TopicosP1Frontend');
  selectedgroups: number[] = [];
  data: any[] = [];
  statustext = '';
  isGetButtonDisabled = false;
  token = sessionStorage.getItem('token');

  ngOnInit(): void {
      console.log(this.app.historydata)
      this.data = [... this.app.historydata];
      if (this.data.length === 0) this.startPolling();
      else this.statustext = 'ACCEPTED';
      console.log(this.token);
      if (!this.token) this.router.navigate(['login']);
  }

  logout() {
    sessionStorage.removeItem('token');
    this.router.navigate(['login'])
  }

  startPolling(): void {
  this.isGetButtonDisabled = true;
  var token = '';
  var finished = false;
  this.statustext = 'CONNECTING';
  this.http.get(`${environment.API_URL}Students/self/history`,
    {headers: new HttpHeaders().set('Authorization', `Bearer ${this.token}`)})
  .pipe(timeout(10000), retry(2))
  .subscribe(
    async (response: any) => {
      token = response.token;
      this.statustext = response.status ==='ACCEPTED' ? 'PENDING' : response.status;
      if (response.status !== 'PENDING') {
        if (response.status === 'ACCEPTED') {
          this.startPolling();
          finished = true;
        }
        return;
      }
      this.data = [];
      this.app.historydata = [];
      this.polling.pollData(`${environment.API_URL}Students/Status/${token}`, 2000)
      .pipe(takeWhile(_ => !finished))
      .subscribe(
        (response: any) => {
          this.data = response;
          this.app.historydata = response;
          this.statustext = response.status;
          if (response.status !== 'PENDING') {
            if (response.status === 'ACCEPTED') {
              this.data = response.result;
              this.app.historydata = response.result;
          }
            this.isGetButtonDisabled = false;
            finished = true;
          }
        },
        (error: any) => {
          this.statustext = 'ERROR';
          this.data = [];
          this.app.historydata = [];
          this.isGetButtonDisabled = false;
          finished = true;
        }
      )
    },
    (_) => {
      this.statustext = 'ERROR';
      this.data = [];
      this.isGetButtonDisabled = false;
      finished = true;
    })
  }
}
