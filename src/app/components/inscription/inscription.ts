import { Component, inject, OnInit, Optional, signal, ViewChild } from '@angular/core';
import Prando from 'prando';
import { HistoryComponent } from "../transactionhistory/transactionhistory";
import { GroupSelectionComponent } from "../groupselection/groupselection";
import { ScheduleComponent } from "../schedule/schedule";
import { Router } from '@angular/router';
import { App } from '../../app';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.html',
  imports: [GroupSelectionComponent, ScheduleComponent],
})
export class InscriptionComponent implements OnInit{
  constructor(@Optional() public app: App) {}
  private router = inject(Router);
  protected readonly title = signal('TopicosP1Frontend');
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
}
