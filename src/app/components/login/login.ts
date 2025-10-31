import { HttpClient } from "@angular/common/http";
import { Component, inject, OnInit, Optional } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { retry, timeout } from "rxjs";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms"
import { App } from "../../app";

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [ FormsModule ]
})

export class LoginComponent implements OnInit{
  constructor(@Optional() public app: App) {}
  private http = inject(HttpClient);
  private router = inject(Router);
  login = '';
  pass = '';
  sending = false;

  ngOnInit() {
    this.app.availabledata = [];
    this.app.historydata = [];
    this.app.selectedgroups = [];
    this.app.token = null;
  }

  sendlogin() {
    const username = this.login;
    const password = this.pass;
    this.sending = true;
    this.http.post(`${environment.API_URL}auth`, {login: username, password: password})
              .pipe(timeout(10000), retry(2))
              .subscribe((response: any) => {
                const token = (response.token as string)
                if (token) {
                  sessionStorage.setItem("token", token);
                  this.router.navigate(['inscription'])
                } else {
                  alert('Login incorrecto, intentelo de nuevo.');
                  this.sending = false;
                }
              },
              (_) => {
                alert('Login incorrecto, intentelo de nuevo.');
                this.sending = false;
              });
  }
}
