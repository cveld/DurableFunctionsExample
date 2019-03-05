import { Component, OnInit, OnDestroy } from '@angular/core';
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

class ImageContainer {
    public url: string;
    public text: string;
}


@Component({
  selector: 'app-fanout',
  templateUrl: './fanout.component.html',
  styleUrls: ['./fanout.component.scss']
})
export class FanoutComponent implements OnInit, OnDestroy {
  baseurl: string;
  orchestratorResult: IOrchestratorResult;
  private subscriptions: Array<Subscription> = new Array<Subscription>();
  messages: Map<number, ImageContainer> = new Map<number, ImageContainer>();
  imageIndex: number;
  imageKeys: Array<number> = new Array<number>();

  constructor(
    private easyAuth: EasyAuthService,
    private configuration: ConfigurationService,
    private http: HttpClient,
    private signalrinfoService: SignalrinfoService) { }

  ngOnInit() {
    this.imageIndex = 0;
    this.baseurl = this.configuration.getValue('functionsApp');
    this.subscriptions.push(this.signalrinfoService.fanout$.subscribe((...data) => this.handleFractalImage(...data)));

    this.subscriptions.push(interval(1000).subscribe(x => {
      this.nextFrame();
    }));
  }

    handleFractalImage(data) {
        const imageIndex = data[0];
        const name = data[1];
        const container = new ImageContainer();
        container.text = `Incoming: ${imageIndex}, ${name}`;
        container.url = `https://mandelbrotstorage.blob.core.windows.net/testing123/${name}.png`;
        container.url = `http://127.0.0.1:10000/devstoreaccount1/testing123/${name}.png`;

        this.messages.set(imageIndex, container);
        this.imageKeys = Array.from(this.messages.keys()).sort((a, b) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
  }

  ngOnDestroy() {
      this.subscriptions.forEach((value) => value.unsubscribe());
  }

  startClicked() {
    this.http.get<IOrchestratorResult>(`${this.baseurl}/api/FanOutMandlebrot_HttpStart`).toPromise().then(data => {
      this.orchestratorResult = data;
    });
  }

  nextFrame(): void {
    if (this.messages.size <= 0) {
      return;
    }


    this.imageIndex++;
    if ( this.imageIndex >= this.imageKeys.length) {
        this.imageIndex = 0;
    }
  }

}

