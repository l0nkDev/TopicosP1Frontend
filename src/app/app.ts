import { Component, inject, OnInit} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

const API_URL = 'http://34.149.69.105/api/';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet]
})
export class App implements OnInit{
  private router = inject(Router);
  token = sessionStorage.getItem('token');

  ngOnInit(): void {
      if (this.token == null) this.router.navigate(['login'])
      else this.router.navigate(['inscription'])
  }
}
