import { Component, OnInit, OnDestroy } from '@angular/core';
import { SignalrinfoService, EasyAuthService } from '../shared';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../lib/Uwv.eDv.Angular.Configuration';
import { MatSlideToggleChange } from '@angular/material';

class DurableFunctionsMapEntity {
    id: string;
    message?: string;
    progress?: number;
    api?: DurableFunctionResponse;
    cancelClicked = false;
    closed = false;
    cancellable = true;

    constructor(id: string) {
        this.id = id;
    }
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

    public suborchestratorCounter = 0;
    public signalrCounter = 0;
    public sequenceCounter = 0;

    ngOnInit() {
        this.connectionInfo$ = this.signalrinfoService.connectioninfo;
        this.subscriptions.push(this.signalrinfoService.carlintveld$.subscribe(data => {
            this.messages.push(`Incoming: ${data}`);
        }));
        this.subscriptions.push(this.signalrinfoService.durable$.subscribe((...data) => this.handleDurable(...data)));
    }

    handleDurable(data) {
        if (!this.durableFunctions.get(data[0].id)) {
            this.durableFunctions.set(data[0].id, new DurableFunctionsMapEntity(data[0].id));
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
        this.signalrCounter++;
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
            }, undefined, () => {
                this.signalrCounter--;
            });
        });
    }

    durableFunctionClicked() {
        this.sequenceCounter++;
        const apiBaseUrl = this.configurationService.getValue('functionsApp');
        const authEnabled = this.configurationService.getValue('authEnabled') !== 'false';
        this.easyAuth.getAuthToken(authEnabled, authEnabled).then((token) => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                // 'Authorization': `Bearer ${token}`
             });
            this.http.post<any>(`${apiBaseUrl}/api/orchestrators/E1_HelloSequence`, null).subscribe(data => {
                // this.messages.push(`Durable: ${data.statusQueryGetUri}`);
                const entity = new DurableFunctionsMapEntity(data.id);
                entity.message = 'initialized';
                entity.progress = 0;
                entity.api = data;
                entity.cancellable = false;
                this.durableFunctions.set(data.id, entity);
            }, undefined, () => {
                this.sequenceCounter--;
            });
        });
    }



    suborchestratorClicked() {
        this.suborchestratorCounter++;
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
                const entity = new DurableFunctionsMapEntity(data.id);
                entity.message = 'initialized';
                entity.progress = 0;
                entity.api = data;
                this.durableFunctions.set(data.id, entity);
            }, undefined, () => {
                // completed default behaviour:
                this.suborchestratorCounter--;
            });
        });
    }


    onSlideToggleChange($event: MatSlideToggleChange) {
        this.showConfiginfo = $event.checked;
    }

    cancelClicked(id) {
        this.durableFunctions.get(id).cancelClicked = true;
        let uri = this.durableFunctions.get(id).api.sendEventPostUri;
        uri = uri.replace('{eventName}', 'CancelSequence');
        this.http.post<DurableFunctionResponse>(uri, {data: 33}).subscribe(undefined, () => {
            // Error; let's reset the spinner
            this.durableFunctions.get(id).cancelClicked = false;
        });
    }

    closeClicked(id) {
        this.durableFunctions.get(id).closed = true;
    }

}

interface DurableFunctionResponse {
    id: string;
    rewindPostUri: string;
    sendEventPostUri: string;
    statusQueryGetUri: string;
    terminatePostUri: string;
}
