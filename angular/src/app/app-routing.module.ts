import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { WorkflowdemoComponent } from './workflowdemo/workflowdemo.component';
import { AuthtesterComponent } from './authtester/authtester.component';
import { LoginComponent } from './login/login.component';
import { FlightsComponent } from './flights/flights.component';
import { FanoutComponent } from './fanout/fanout.component';

const routes: Routes = [
    { path: 'authtester', component: AuthtesterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'flights', component: FlightsComponent },
    { path: 'fanout', component: FanoutComponent },
    { path: 'error', component: ErrorComponent },
    { path: '**', component: WorkflowdemoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
