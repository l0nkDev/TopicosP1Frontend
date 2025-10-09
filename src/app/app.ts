import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { PollingService } from './polling-service';
import { takeWhile } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TopicosP1Frontend');
  private http = inject(HttpClient)
  private polling = inject(PollingService)
  statustext = '';
  submissionStatus = '';
  submissionResponse = '';
  data: any[] = [];
  selectedgroups: number[] = [];

  startPolling(): void {
    var token = '';
    var finished = false;
    this.http.get('http://localhost:5065/api/Students/1/available')
    .subscribe(
      async (response: any) => {
        token = response.token;
        this.statustext = response.status;
        if (response.status !== 'PENDING') {
          if (response.status === 'ACCEPTED')
            this.data = response.result;
          return;
        }
        this.data = [];
        this.polling.pollData('http://localhost:5065/api/Admin/Transaction/' + token, 2000)
        .pipe(takeWhile(_ => !finished))
        .subscribe(
          (response: any) => {
            this.data = response;
            this.statustext = response.status;
            if (response.status !== 'PENDING') {
              if (response.status === 'ACCEPTED')
                this.data = response.result;
              finished = true;
            }
          }
        )
      }
    )
  }

  async startSubmitPolling(): Promise<void> {
    var token = '';
    var finished = false;
    var payload = {
        "id": 0,
        "student": 1,
        "period": 2,
        "gestion": 2025,
        "type": 0,
        "groupIds": this.selectedgroups
      };
      (payload as any).requestId = await sha256HashBrowser(JSON.stringify(payload));
      console.log(payload);
    this.http.post('http://localhost:5065/api/Inscriptions', payload
    )
    .subscribe(
      async (response: any) => {
        console.log(response)
        token = response.token;
        this.submissionStatus = response.status;
        if (response.status !== 'PENDING') {
          if (response.status === 'ACCEPTED')
            this.submissionResponse = JSON.stringify(response.result);
          this.submissionStatus = response.status;
          return;
        }
        this.polling.pollData('http://localhost:5065/api/Admin/Transaction/' + token, 2000)
        .pipe(takeWhile(_ => !finished))
        .subscribe(
          (response: any) => {
            this.submissionResponse = JSON.stringify(response.result);
            this.submissionStatus = response.status;
            if (response.status !== 'PENDING') {
              if (response.status === 'ACCEPTED')
                this.submissionResponse = JSON.stringify(response.result);
              finished = true;
            }
          }
        )
      }
    )
  }

  updateGroup(id: number, checked: boolean) {
    if (checked) this.selectedgroups.push(id);
    else this.selectedgroups = this.selectedgroups.filter(_ => _ != id);
    console.log(this.selectedgroups);
  }
}

    async function sha256HashBrowser(inputString: string): Promise<string> {
        const textEncoder = new TextEncoder();
        const data = textEncoder.encode(inputString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hexHash;
    }
