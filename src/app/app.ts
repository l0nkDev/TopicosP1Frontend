import { Capacitor } from '@Capacitor/core';
import { Component, inject, OnInit, ViewChild} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, NavbarComponent, NavbarComponent]
})
export class App implements OnInit{
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;
  private router = inject(Router);
  token = sessionStorage.getItem('token');
  public historydata: any[] = [];
  public availabledata: any[] = [];
  public selectedgroups: number[] = [];
  public platform = Capacitor.getPlatform();

  ngOnInit(): void {
      if (this.token == null) this.router.navigate(['login'])
      else this.router.navigate(['inscription'])
  }
}
