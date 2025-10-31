import { Component, inject, Optional, ViewChild } from "@angular/core";
import { HistoryComponent } from "../transactionhistory/transactionhistory";
import { Router } from "@angular/router";
import { App } from "../../app";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [HistoryComponent]
})

export class NavbarComponent {
  public router = inject(Router);
  constructor(@Optional() public app: App) {}
  @ViewChild(HistoryComponent) historyComponent!: HistoryComponent;

  logout() {
    sessionStorage.removeItem('token');
    this.router.navigate(['login'])
  }
}
