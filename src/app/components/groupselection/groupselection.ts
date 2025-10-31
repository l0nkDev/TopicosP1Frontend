import { Component, inject, OnInit, Optional } from "@angular/core";
import { InscriptionComponent } from "../inscription/inscription";
import { retry, takeWhile, timeout } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { PollingService } from "../../polling-service";
import { environment } from "../../../environments/environment.development";

@Component({
  selector: 'app-groupselection',
  templateUrl: './groupselection.html'
})

export class GroupSelectionComponent implements OnInit{
  constructor(@Optional() public inscription: InscriptionComponent) {}

  showingSubmitDialog = false;
  isPostButtonDisabled = false;
  submissionStatus = '';
  submissionResponse: any;
  statustext = '';
  isGetButtonDisabled = false;
  showEmptySubjects = false;
  displayedData: any[] = [];
  searchTerm = '';
  private http = inject(HttpClient)
  private polling = inject(PollingService)

  ngOnInit(): void {
      if (this.inscription.app.availabledata.length === 0) this.startPolling();
      else this.updateSearchTerm(this.searchTerm);
  }


  updateGroup(id: number, checked: boolean) {
    if (checked) this.inscription.app.selectedgroups.push(id);
    else this.inscription.app.selectedgroups = this.inscription.app.selectedgroups.filter(_ => _ != id);
  }

  updateSearchTerm(term: string) {
    this.searchTerm = term.toLowerCase();
    if (this.searchTerm === '') {
      this.displayedData = this.inscription.app.availabledata;
    } else {
      this.displayedData = this.inscription.app.availabledata.filter(subject =>
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

    closeSubmitDialog() {
    this.showingSubmitDialog = false;
    this.inscription.app.availabledata = [];
    this.displayedData = [];
    this.statustext = '';
    this.startPolling();
  }

  isGroupDisabled(id: number, subject: any): boolean {
  if (this.inscription.app.selectedgroups.includes(id)) return false;
  const procgroup = this.inscription.app.availabledata.flatMap(subject => subject.groups).find((g: any) => g.id === id);
  if (subject.groups.some((g: any) => this.inscription.app.selectedgroups.includes(g.id))) return true;
  const timeslots = [];
  for (const gid of this.inscription.app.selectedgroups) {
    timeslots.push(...this.inscription.app.availabledata.flatMap(subject => subject.groups).find((g: any) => g.id === gid)?.timeslots || []);
  }
  for (const slot of procgroup.timeslots) {
    for (const selected of timeslots) {
      if (this.inscription.formatDay(slot.day) === this.inscription.formatDay(selected.day) && (
        (this.inscription.formatForComparison(slot.startTime) === this.inscription.formatForComparison(selected.startTime) && this.inscription.formatForComparison(slot.endTime) > this.inscription.formatForComparison(selected.endTime)) ||
        (this.inscription.formatForComparison(slot.startTime) < this.inscription.formatForComparison(selected.endTime) && this.inscription.formatForComparison(slot.startTime) > this.inscription.formatForComparison(selected.startTime)) ||
        (this.inscription.formatForComparison(slot.endTime) < this.inscription.formatForComparison(selected.endTime) && this.inscription.formatForComparison(slot.endTime) > this.inscription.formatForComparison(selected.startTime)))) {
        return true;
      }
    }
  }
  return false;
}

  startPolling(): void {
    this.inscription.app.selectedgroups = [];
    this.isGetButtonDisabled = true;
    var token = '';
    var finished = false;
    this.statustext = 'CONNECTING';
    this.http.get(`${environment.API_URL}Students/self/available`,
      {headers: new HttpHeaders().set('Authorization', `Bearer ${this.inscription.token}`)})
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
        this.inscription.app.availabledata = [];
        this.displayedData = [];
        this.polling.pollData(`${environment.API_URL}Students/Status/${token}`, 2000)
        .pipe(takeWhile(_ => !finished))
        .subscribe(
          (response: any) => {
            this.inscription.app.availabledata = response;
            this.statustext = response.status;
            if (response.status !== 'PENDING') {
              if (response.status === 'ACCEPTED') {
                this.inscription.app.availabledata = response.result;
                this.displayedData = this.inscription.app.availabledata;
                this.updateSearchTerm(this.searchTerm);
            }
              this.isGetButtonDisabled = false;
              finished = true;
            }
          },
          (error: any) => {
            this.statustext = 'ERROR';
            this.inscription.app.availabledata = [];
            this.isGetButtonDisabled = false;
            finished = true;
          }
        )
      },
      (_) => {
        this.statustext = 'ERROR';
        this.inscription.app.availabledata = [];
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
      "student": 0,
      "period": 2,
      "gestion": 2025,
      "type": 0,
      "groupIds": this.inscription.app.selectedgroups
    };
    (payload as any).requestId = await sha256HashBrowser(JSON.stringify(payload));
    this.http.post(`${environment.API_URL}Inscriptions/self`, payload,
      {headers: new HttpHeaders().set('Authorization', `Bearer ${this.inscription.token}`)})
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
        for (const groupId of this.inscription.app.selectedgroups) {
          const group = this.inscription.app.availabledata.flatMap(subject => subject.groups).find((g: any) => g.id === groupId);
          if (group) {
            groups += `${group.subject.code}-${group.code}, `;
          }
        }
        this.inscription.app.navbar.historyComponent.addSubmission({token: token, status: 'PENDING', timestamp: new Date().toLocaleString(), details: groups.slice(0, -2)});
      },
      (_) => {
        this.submissionStatus = 'ERROR';
        this.submissionResponse = '';
        this.isPostButtonDisabled = false;
        finished = true;
      }
    )
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
