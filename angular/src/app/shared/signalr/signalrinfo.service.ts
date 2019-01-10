import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject, Observable, Subscription, Subject } from 'rxjs';
import { shareReplay, map, tap } from 'rxjs/operators';
import { HubConnectionBuilder, HubConnection } from '@aspnet/signalr';
import { ConfigurationService } from '../../lib/Uwv.eDv.Angular.Configuration';
import * as jwtDecode from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../token/token.service';

@Injectable({
providedIn: 'root'
})
export class SignalrinfoService implements OnDestroy {
    private apiBaseUrl;
    private cache$: Observable<any>;
    private subscriptions: Subscription[] = new Array<Subscription>();
    public carlintveld$: Subject<any>;
    connectioninfo: any;
    private exponentionalBackoff = [2, 5, 10, 15, 20, 25, 30];
    private exponentionalBackoffIndex = 0;
    durable$: Subject<any>;

    constructor(
        private http: HttpClient,
        private configurationService: ConfigurationService,
        private tokenService: TokenService
        ) {
        this.carlintveld$ = new Subject<any>();
        this.durable$ = new Subject<any>();
        this.apiBaseUrl = this.configurationService.getValue('functionsApp');
        this.initializeHub();
    }

    getConnectionInfo() {
        const result = this.http.get<any>(`${this.apiBaseUrl}/api/SignalRInfo`).pipe(tap(data => {
        this.connectioninfo = data;
        }));
        return result;
    }

    getConnectionInfoold() {
        if (!this.cache$) {
            this.cache$ = this.http.get(`${this.apiBaseUrl}/api/SignalRInfo`).pipe(data => {
            return data;
            })
            .pipe(shareReplay(1));
        }
        return this.cache$;
    }

    initializeHub() {
        this.subscriptions.push(this.getConnectionInfo().subscribe(data => this.setupStream(data)));
    }

    private setupStream(data: any) {
        const accessToken = this.connectioninfo.accessToken;
        const options = {
            accessTokenFactory: () => {
                if (accessToken && !this.tokenService.isTokenExpired(accessToken)) {

                    const _accessToken = accessToken;
                    // accessToken = null;
                    return _accessToken;
                }
                return this.getConnectionInfo().toPromise().then(data1 => {
                    return data1.accessToken;
                });
            }
    };
    const connection = new HubConnectionBuilder()
        .withUrl(data.url, options)
        .build();
    connection.on('carlintveldEvent', (...params) => this.carlintveldEvent(...params));
    connection.on('durableEvent', (...params) => this.durableEvent(...params));
    connection.onclose(() => {
        console.log('disconnected');
        setTimeout(() => { this.startConnection(connection); }, this.getNewWaitTime());
    });
    this.startConnection(connection);

    }
    durableEvent(...data): void {
        this.durable$.next(data);
    }

    private carlintveldEvent(...data) {
        console.log(data);
        this.carlintveld$.next(data);
    }

    getNewWaitTime() {
        const currentIndex = this.exponentionalBackoffIndex;
        if (this.exponentionalBackoffIndex + 1 < this.exponentionalBackoff.length) {
            this.exponentionalBackoffIndex++;
        }
        return this.exponentionalBackoff[currentIndex];
    }

    private startConnection(connection: HubConnection) {
        console.log('connecting...');
        connection.start()
        .then(() => {
            console.log('connected!');
            // reset the exponentialBackoffIndex:
            this.exponentionalBackoffIndex = 0;
            })
        .catch((err) => {
            console.error(err);
            // enforce retrieval of updated accessToken:
            this.connectioninfo = null;
            setTimeout(() => { this.startConnection(connection); }, this.getNewWaitTime());
        });
    }


    ngOnDestroy(): void {
        this.subscriptions.forEach((value) => { value.unsubscribe(); });
    }
}
