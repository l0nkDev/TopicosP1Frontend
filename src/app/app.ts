import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { PollingService } from './polling-service';
import { takeWhile } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';
import Prando from 'prando';
import { HistoryComponent } from "./components/history/history";
import { ScheduleComponent } from "./components/schedule/schedule";

const API_URL = 'http://34.149.69.105/api/';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [HistoryComponent, ScheduleComponent]
})
export class App implements AfterViewInit{
  @ViewChild(HistoryComponent) historyComponent!: HistoryComponent;
  protected readonly title = signal('TopicosP1Frontend');
  private http = inject(HttpClient)
  private polling = inject(PollingService)
  statustext = '';
  submissionStatus = '';
  submissionResponse: any;
  isGetButtonDisabled = false;
  isPostButtonDisabled = false;
  showEmptySubjects = false;
  showingSubmitDialog = false;
  data: any[] = [];
  displayedData: any[] = [];
  searchTerm = '';
  selectedgroups: number[] = [];

  ngAfterViewInit(): void {
      this.startPolling();
  }

  startPolling(): void {
    this.selectedgroups = [];
    this.isGetButtonDisabled = true;
    var token = '';
    var finished = false;
    this.statustext = 'CONNECTING';
    this.http.get(`${API_URL}Students/1/available`)
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
        this.displayedData = [];
        this.polling.pollData(`${API_URL}Students/Status/${token}`, 2000)
        .pipe(takeWhile(_ => !finished))
        .subscribe(
          (response: any) => {
            this.data = response;
            this.statustext = response.status;
            if (response.status !== 'PENDING') {
              if (response.status === 'ACCEPTED') {
                this.data = response.result;
                this.displayedData = this.data;
                this.updateSearchTerm(this.searchTerm);
            }
              this.isGetButtonDisabled = false;
              finished = true;
            }
          },
          (error: any) => {
            this.statustext = 'ERROR';
            this.data = [];
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
      }
    )
  }

  async startSubmitPolling(): Promise<void> {
    this.isPostButtonDisabled = true;
    var token = '';
    var finished = false;
    this.submissionStatus = 'CONNECTING';
    this.showingSubmitDialog = true;
    var payload = {
        "id": 0,
        "student": 1,
        "period": 2,
        "gestion": 2025,
        "type": 0,
        "groupIds": this.selectedgroups
      };
      (payload as any).requestId = await sha256HashBrowser(JSON.stringify(payload));
    this.http.post(`${API_URL}Inscriptions`, payload)
    .pipe(timeout(10000), retry(2))
    .subscribe(
      async (response: any) => {
        token = response.token;
        this.submissionStatus = response.status;
        if (response.status === 'ACCEPTED')
          this.submissionResponse = response.result;
        finished = true;
        this.submissionStatus = response.status;
        this.isPostButtonDisabled = false;
        let groups = '';
        for (const groupId of this.selectedgroups) {
          const group = this.data.flatMap(subject => subject.groups).find((g: any) => g.id === groupId);
          if (group) {
            groups += `${group.subject.code}-${group.code}, `;
          }
        }
        this.historyComponent.addSubmission({token: token, status: 'PENDING', timestamp: new Date().toLocaleString(), details: groups.slice(0, -2)});
      },
      (_) => {
        this.submissionStatus = 'ERROR';
        this.submissionResponse = '';
        this.isPostButtonDisabled = false;
        finished = true;
      }
    )
  }

  updateGroup(id: number, checked: boolean) {
    if (checked) this.selectedgroups.push(id);
    else this.selectedgroups = this.selectedgroups.filter(_ => _ != id);
  }

  updateSearchTerm(term: string) {
    this.searchTerm = term.toLowerCase();
    if (this.searchTerm === '') {
      this.displayedData = this.data;
    } else {
      this.displayedData = this.data.filter(subject =>
        subject.title.toLowerCase().includes(this.searchTerm) ||
        subject.code.toLowerCase().includes(this.searchTerm)
      );
    }
    if (!this.showEmptySubjects) {
      this.displayedData = this.displayedData.filter(subject => subject.groups.length > 0);
    }
  }

  toggleEmptySubjects(value: boolean) {
    this.showEmptySubjects = value;
    this.updateSearchTerm(this.searchTerm);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return hours + ':' + minutes;
  }

  formatForComparison(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  formatDay(day: string): string {
    switch(day) {
      case 'Monday': return 'Lu';
      case 'Tuesday': return 'Ma';
      case 'Wednesday': return 'Mi';
      case 'Thursday': return 'Ju';
      case 'Friday': return 'Vi';
      case 'Saturday': return 'Sa';
      case 'Sunday': return 'Do';
      default: return day;
    }
  }

  generateRandomPastelColor(input: string): string {
    let rng = new Prando(input);
    const hash = rng.next();
    const hue = Math.floor(hash * 361);
    const saturation = Math.floor(hash * 31) + 40;
    const lightness = Math.floor(hash * 21) + 70;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  closeSubmitDialog() {
    this.showingSubmitDialog = false;
    this.data = [];
    this.displayedData = [];
    this.statustext = '';
    this.startPolling();
  }

  isGroupDisabled(id: number, subject: any): boolean {
    if (this.selectedgroups.includes(id)) return false;
    const procgroup = this.data.flatMap(subject => subject.groups).find((g: any) => g.id === id);
    if (subject.groups.some((g: any) => this.selectedgroups.includes(g.id))) return true;
    const timeslots = [];
    for (const gid of this.selectedgroups) {
      timeslots.push(...this.data.flatMap(subject => subject.groups).find((g: any) => g.id === gid)?.timeslots || []);
    }
    for (const slot of procgroup.timeslots) {
      for (const selected of timeslots) {
        if (this.formatDay(slot.day) === this.formatDay(selected.day) && (
          (this.formatForComparison(slot.startTime) === this.formatForComparison(selected.startTime) && this.formatForComparison(slot.endTime) > this.formatForComparison(selected.endTime)) ||
          (this.formatForComparison(slot.startTime) < this.formatForComparison(selected.endTime) && this.formatForComparison(slot.startTime) > this.formatForComparison(selected.startTime)) ||
          (this.formatForComparison(slot.endTime) < this.formatForComparison(selected.endTime) && this.formatForComparison(slot.endTime) > this.formatForComparison(selected.startTime)))) {
          return true;
        }
      }
    }
    return false;
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
