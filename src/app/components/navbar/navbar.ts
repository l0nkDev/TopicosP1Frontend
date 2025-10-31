import { Component, inject, ViewChild } from "@angular/core";
import { HistoryComponent } from "../transactionhistory/transactionhistory";
import { Router } from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [HistoryComponent]
})

export class NavbarComponent {
  public router = inject(Router);
  @ViewChild(HistoryComponent) historyComponent!: HistoryComponent;

  logout() {
    sessionStorage.removeItem('token');
    this.router.navigate(['login'])
  }
}
