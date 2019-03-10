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
    public finished = false;
    public loaded = false;
}


@Component({
    selector: 'app-fanout',
    templateUrl: './fanout.component.html',
    styleUrls: ['./fanout.component.scss']
})
export class FanoutComponent implements OnInit, OnDestroy {

    constructor(
        private easyAuth: EasyAuthService,
        private configuration: ConfigurationService,
        private http: HttpClient,
        private signalrinfoService: SignalrinfoService) { }

    baseurl: string;
    orchestratorResult: IOrchestratorResult;
    private subscriptions: Array<Subscription> = new Array<Subscription>();
    images: Map<number, ImageContainer> = new Map<number, ImageContainer>();
    imageIndex: number;
    imageKeys: Array<number> = new Array<number>();
    imageIndicesLoaded: Array<number> = new Array<number>();
    generatingCount = 0;
    totalFrames = 0;
    generatingStarted = false;
    clickedCount = 0;

    ngOnInit() {
        this.imageIndex = 0;
        this.baseurl = this.configuration.getValue('functionsApp');
        this.subscriptions.push(this.signalrinfoService.fanout$.subscribe((...data) => this.handleFractalImage(...data)));

        this.subscriptions.push(interval(50).subscribe(x => {
        this.nextFrame();
        }));
    }

    countQueuedFrames() {
        let counter = 0;
        this.images.forEach((container) => {
            if (!container.finished) {
                counter++;
            }
        });
        return counter;
    }

    displayImage(key: number, index: number) {
        const img = this.images.get(key);

        // If image is loaded and it is the image to be rendered, then return true
        if (img.loaded && index === this.imageIndex) {
            return true;
        }

        // If image is loadded and it is not the image to be rendered, then return false
        if (index !== this.imageIndex) {
            return false;
        }
    }

    handleFractalImage(data) {
        const phase = data[0]; // started | finished
        const imageIndex = data[1];
        const name = data[2];
        const container = new ImageContainer();
        container.text = `Incoming: ${imageIndex}, ${name}`;
        const storageBaseUri = this.configuration.getValue('storageBaseUri');
        container.url = `${storageBaseUri}/${name}.png`;
        container.finished = phase === 'finished';
        this.images.set(imageIndex, container);

        this.imageKeys = Array.from(this.images.keys()).sort((a, b) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        }).filter((key) => {
            return this.images.get(key).finished;
        });

        this.refreshImagesLoaded();

        this.generatingCount = this.countQueuedFrames();
    }

    refreshImagesLoaded() {
        this.imageIndicesLoaded = this.imageKeys.reduce((result, key, index) =>
        [...result, ...this.images.get(key).loaded ? [index] : []], []);
    }

    onImageLoad(key: number) {
        this.images.get(key).loaded = true;
        this.refreshImagesLoaded();
    }

    ngOnDestroy() {
        this.subscriptions.forEach((value) => value.unsubscribe());
    }

    startClicked() {
        this.clickedCount++;
        this.http.get<IOrchestratorResult>(`${this.baseurl}/api/FanOutMandlebrot_HttpStart`).subscribe(data => {
            this.orchestratorResult = data;
            this.generatingStarted = true;
        }, undefined, () => {
            this.clickedCount--;
        });
  }

  nextFrame(): void {
    if (this.images.size <= 0) {
      return;
    }


    this.imageIndex++;
    if ( this.imageIndex >= this.imageIndicesLoaded.length) {
        this.imageIndex = 0;
    }
  }

}

