import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { EasyAuthService, SignalrinfoService } from '../shared';
import { ConfigurationService } from '../lib/Configuration';
import {Observable, interval} from 'rxjs';
import { Subscription } from 'rxjs';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';

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
  messages: Array<ImageContainer> = new Array<ImageContainer>();
  imageIndex: number;


  constructor(
    private easyAuth: EasyAuthService,
    private configuration: ConfigurationService,
    private http: HttpClient,
    private signalrinfoService: SignalrinfoService) { }

  ngOnInit() {
    this.imageIndex = 0;
    this.baseurl = this.configuration.getValue('functionsApp');
    this.subscriptions.push(this.signalrinfoService.fanout$.subscribe(data => {
      const container = new ImageContainer();
      container.text = `Incoming: ${data}`;
      container.url = `https://mandelbrotstorage.blob.core.windows.net/testing123/${data}.png`;
      this.messages.push(container);
  }));

    interval(1000).subscribe(x => {
      this.nextFrame();
      console.log('working');
    });
  }

  startClicked() {
    this.http.get<IOrchestratorResult>(`${this.baseurl}/api/FanOutMandlebrot_HttpStart`).toPromise().then(data => {
      this.orchestratorResult = data;
    });
  }

  nextFrame(): void {
    if (this.messages.length <= 0) {
      return;
    }
    if ( this.imageIndex + 1 >= this.messages.length - 1 ) {
      this.imageIndex = 0;
    }
    this.imageIndex += 1;
  }

}

  class ImageContainer {
    public url: string;
    public text: string;
}
