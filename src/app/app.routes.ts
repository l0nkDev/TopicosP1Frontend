import { Routes } from '@angular/router';
import { InscriptionComponent } from './components/inscription/inscription';
import { LoginComponent } from './components/login/login';
import { App } from './app';

export const routes: Routes = [
  {
    path: 'inscription',
    component: InscriptionComponent
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
