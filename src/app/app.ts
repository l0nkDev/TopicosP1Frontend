import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { PollingService } from './polling-service';
import { takeWhile } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';
import Prando from 'prando';

const API_URL = 'http://34.29.81.225/api/';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit{
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

  TIME_SLOTS = [{start: '7:00',  end: '7:45' }, {start: '7:45',  end: '8:30' }, {start: '8:30',  end: '9:15' }, {start: '9:15',  end: '10:00'},
                {start: '10:00', end: '10:45'}, {start: '10:45', end: '11:30'}, {start: '11:30', end: '12:15'}, {start: '12:15', end: '13:00'},
                {start: '13:00', end: '13:45'}, {start: '13:45', end: '14:30'}, {start: '14:30', end: '15:15'}, {start: '15:15', end: '16:00'},
                {start: '16:00', end: '16:45'}, {start: '16:45', end: '17:30'}, {start: '17:30', end: '18:15'}, {start: '18:15', end: '19:00'},
                {start: '19:00', end: '19:45'}, {start: '19:45', end: '20:30'}, {start: '20:30', end: '21:15'}, {start: '21:15', end: '22:00'},
                {start: '22:00', end: '22:45'}];

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
        this.polling.pollData(`${API_URL}Admin/Transaction/${token}`, 2000)
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
      console.log(payload);
    this.http.post(`${API_URL}Inscriptions`, payload)
    .pipe(timeout(10000), retry(2))
    .subscribe(
      async (response: any) => {
        token = response.token;
        this.submissionStatus = response.status;
        if (response.status !== 'PENDING') {
          if (response.status === 'ACCEPTED') {
            this.submissionResponse = response.result;
            finished = true;
            this.isPostButtonDisabled = false;
          }
          this.submissionStatus = response.status;
          this.isPostButtonDisabled = false;
          return;
        }
        this.polling.pollData(`${API_URL}Admin/Transaction/${token}`, 2000)
        .pipe(takeWhile(_ => !finished))
        .subscribe(
          (response: any) => {
            console.log(response.result);
            this.submissionResponse = response.result;
            this.submissionStatus = response.status;
            if (response.status !== 'PENDING') {
              this.isPostButtonDisabled = false;
              finished = true;
            }
          },
          (_) => {
            this.submissionStatus = 'ERROR';
            this.submissionResponse = '';
            this.isPostButtonDisabled = false;
            finished = true;
          }
        )
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
    console.log(this.selectedgroups);
  }

  checkSlot(start: string, end: string, day: string): any {
    for (const group of this.selectedgroups) {
      const groupData = this.data.flatMap(subject => subject.groups).find((g: any) => g.id === group);
      if (groupData) {
        for (const timeslot of groupData.timeslots) {
          if (this.formatForComparison(timeslot.startTime) <= this.formatForComparison(start) && this.formatForComparison(timeslot.endTime) >= this.formatForComparison(end) && this.formatDay(timeslot.day) === day) {
            const subject = this.data.find(sub => sub.groups.some((g: any) => g.id === group));
            return subject;
          }
        }
      }
    }
    return null;
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
    console.log(hash);
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
}

async function sha256HashBrowser(inputString: string): Promise<string> {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash;
}
