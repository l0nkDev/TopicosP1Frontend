import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { PollingService } from '../../polling-service';
import { takeWhile } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';
import Prando from 'prando';
import { HistoryComponent } from "../transactionhistory/transactionhistory";
import { GroupSelectionComponent } from "../groupselection/groupselection";
import { ScheduleComponent } from "../schedule/schedule";
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.html',
  imports: [GroupSelectionComponent, HistoryComponent, ScheduleComponent],
})
export class InscriptionComponent implements OnInit{
  @ViewChild(HistoryComponent) historyComponent!: HistoryComponent;
  private router = inject(Router);
  protected readonly title = signal('TopicosP1Frontend');
  selectedgroups: number[] = [];
  data: any[] = [];
  token = sessionStorage.getItem('token');

  ngOnInit(): void {
      console.log(this.token);
      if (!this.token) this.router.navigate(['login']);
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

  logout() {
    sessionStorage.removeItem('token');
    this.router.navigate(['login'])
  }
}
