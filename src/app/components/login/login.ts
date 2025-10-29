import { HttpClient } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { retry, timeout } from "rxjs";
import { Router } from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.html'

})

export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  sendlogin(username: string, password: string) {
    this.http.post(`${environment.API_URL}auth`, {login: username, password: password})
              .pipe(timeout(10000), retry(2))
              .subscribe((response: any) => {
                const token = (response.token as string)
                if (token) {
                  sessionStorage.setItem("token", token);
                  this.router.navigate(['inscription'])
                } else {
                  alert('Login incorrecto, intentelo de nuevo.');
                }
              },
              (_) => {
                alert('Login incorrecto, intentelo de nuevo.');
              });
  }
}
