import { Routes } from '@angular/router';
import { InscriptionComponent } from './components/inscription/inscription';
import { LoginComponent } from './components/login/login';
import { App } from './app';
import { HistoryComponent } from './components/history/history';

export const routes: Routes = [
  {
    path: 'inscription',
    component: InscriptionComponent
  },
  {
    path: 'history',
    component: HistoryComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: App
  }
];
