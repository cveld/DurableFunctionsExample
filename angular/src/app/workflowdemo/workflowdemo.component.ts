import { Component, OnInit, OnDestroy } from '@angular/core';
import { SignalrinfoService, EasyAuthService } from '../shared';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../lib/Uwv.eDv.Angular.Configuration';
import { MatSlideToggleChange } from '@angular/material';

interface DurableFunctionsMapEntity {
    id: string;
    message?: string;
    progress?: number;
    api?: DurableFunctionResponse;
}

@Component({
  selector: 'app-workflowdemo',
  templateUrl: './workflowdemo.component.html',
  styleUrls: ['./workflowdemo.component.scss']
})
export class WorkflowdemoComponent implements OnInit, OnDestroy {
    connectionInfo$;
    private subscriptions: Array<Subscription> = new Array<Subscription>();
    messages: Array<string> = new Array<string>();
    durableFunctions: Map<string, DurableFunctionsMapEntity> = new Map<string, DurableFunctionsMapEntity>();
    showConfiginfo = false;

    constructor(
        private configurationService: ConfigurationService,
        public signalrinfoService: SignalrinfoService,
        private http: HttpClient,
        private easyAuth: EasyAuthService
    ) { }

    ngOnInit() {
        this.connectionInfo$ = this.signalrinfoService.connectioninfo;
        this.subscriptions.push(this.signalrinfoService.carlintveld$.subscribe(data => {
            this.messages.push(`Incoming: ${data}`);
        }));
        this.subscriptions.push(this.signalrinfoService.durable$.subscribe((...data) => this.handleDurable(...data)));
    }

    handleDurable(data) {
        if (!this.durableFunctions.get(data[0].id)) {
            this.durableFunctions.set(data[0].id, { id : data[0].id });
        } else {
            if (this.durableFunctions.get(data[0].id).progress === 100) {
                return;
            }
        }
        this.durableFunctions.get(data[0].id).message = data[0].message;
        this.durableFunctions.get(data[0].id).progress = data[0].progress;
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
    signalrclicked() {
        const apiBaseUrl = this.configurationService.getValue('functionsApp');
        const code = this.configurationService.getValue('functionsAppCode');

        this.easyAuth.getAuthToken(true, false).then(token => {
            let options;
            if (!!token) {
                const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                });
                options = { headers: headers };
            }
            this.http.get<any>(`${apiBaseUrl}/api/SendSignalRMessage?code=${code}`, options).subscribe(data => {
            });
        });
    }

    durableFunctionClicked() {
        const apiBaseUrl = this.configurationService.getValue('functionsApp');
        this.easyAuth.getAuthToken().then((token) => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                // 'Authorization': `Bearer ${token}`
             });
            this.http.post<any>(`${apiBaseUrl}/api/orchestrators/E1_HelloSequence`, null).subscribe(data => {
                // this.messages.push(`Durable: ${data.statusQueryGetUri}`);
                this.durableFunctions.set(data.id, { id: data.id, message: 'Initialized', progress: 0, api: data });
            });
        });
    }



    suborchestratorClicked() {
        const apiBaseUrl = this.configurationService.getValue('functionsApp');
        const authEnabled = this.configurationService.getValue('authEnabled') !== 'false';
        this.easyAuth.getAuthToken(authEnabled, authEnabled).then((token) => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                // 'Authorization': `Bearer ${token}`
             });
            // tslint:disable-next-line:max-line-length
            this.http.post<DurableFunctionResponse>(`${apiBaseUrl}/api/orchestrators/E1_HelloSequenceWithSuborchestrator`, null).subscribe(data => {
                // this.messages.push(`Durable: ${data.statusQueryGetUri}`);
                this.durableFunctions.set(data.id, { id: data.id, message: 'Initialized', progress: 0, api: data });
            });
        });
    }


    onSlideToggleChange($event: MatSlideToggleChange) {
        this.showConfiginfo = $event.checked;
    }

    cancelClicked(id) {
        let uri = this.durableFunctions.get(id).api.sendEventPostUri;
        uri = uri.replace('{eventName}', 'CancelSequence');
        this.http.post<DurableFunctionResponse>(uri, {data: 33}).subscribe();
    }

}

interface DurableFunctionResponse {
    id: string;
    rewindPostUri: string;
    sendEventPostUri: string;
    statusQueryGetUri: string;
    terminatePostUri: string;
}
