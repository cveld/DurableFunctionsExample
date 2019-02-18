import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { EasyAuthService, SignalrinfoService } from '../shared';
import { ConfigurationService } from '../lib/Configuration';
import { Subscription } from 'rxjs';

interface IOrchestratorResult {
  id: string;
  statusQueryGetUri: string;
  sendEventPostUri: string;
  terminatePostUri: string;
  rewindPostUri: string;
}

@Component({
  selector: 'app-fanout',
  templateUrl: './fanout.component.html',
  styleUrls: ['./fanout.component.scss']
})
export class FanoutComponent implements OnInit {
  baseurl: string;
  orchestratorResult: IOrchestratorResult;
  private subscriptions: Array<Subscription> = new Array<Subscription>();
  messages: Array<string> = new Array<string>();

  constructor(
    private easyAuth: EasyAuthService,
    private configuration: ConfigurationService,
    private http: HttpClient,
    private signalrinfoService: SignalrinfoService) { }

  ngOnInit() {
    this.baseurl = this.configuration.getValue('functionsApp');
    this.subscriptions.push(this.signalrinfoService.fanout$.subscribe(data => {
      this.messages.push(`Incoming: ${data}`);
  }));

  }

  startClicked() {
    this.http.get<IOrchestratorResult>(`${this.baseurl}/api/FanOutMandlebrot_HttpStart`).toPromise().then(data => {
      this.orchestratorResult = data;
    });
  }
}
