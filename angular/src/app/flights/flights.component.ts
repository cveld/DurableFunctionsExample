import { Component, OnInit, ViewChild } from '@angular/core';
import { Marker, IMapOptions, MarkerTypeId, IBox, IMarkerIconInfo, ILatLong, MapTypeId,
            IMarkerOptions } from 'angular-maps';
import { SignalrinfoService, EasyAuthService } from '../shared';
import { Subscription } from 'rxjs';
import { MyCanvasLayerDirective } from '../my-map-layer/my-canvas-layer';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../lib/Uwv.eDv.Angular.Configuration';

@Component({
    selector: 'app-flights',
    templateUrl: './flights.component.html',
    styleUrls: ['./flights.component.scss']
})
export class FlightsComponent implements OnInit {
    private subscriptions: Array<Subscription> = new Array<Subscription>();
    @ViewChild(MyCanvasLayerDirective) mycanvaslayer: MyCanvasLayerDirective;
    private monitorFunctionData: {
        id: string,
        statusQueryGetUri: string,
        sendEventPostUri: string,
        terminatePostUri: string,
        rewindPostUri: string
    };

    constructor(
        private signalrinfoService: SignalrinfoService,
        private http: HttpClient,
        private configurationService: ConfigurationService,
        private easyAuth: EasyAuthService
    ) {
        this.subscriptions.push(this.signalrinfoService.flights$.subscribe((...data) => this.handleFlights(...data)));
    }

    public _options: IMapOptions = {
        disableBirdseye: false,
        disableStreetside: false,
        navigationBarMode: 1,
        zoom: 6,
        mapTypeId: MapTypeId.road,
        liteMode: true
    };
    public _markerTypeId = MarkerTypeId;
            // a little trick so we can use enums in the template...

    public _box: IBox = {
        maxLatitude: 54,
        maxLongitude: 10,
        minLatitude: 49,
        minLongitude: 0
    };

    counter = 0;

    ngOnInit() {
    }

    startMonitorClicked() {
        const apiBaseUrl = this.configurationService.getValue('functionsApp');
        const authEnabled = this.configurationService.getValue('authEnabled') !== 'false';
        this.easyAuth.getAuthToken(authEnabled, authEnabled).then((token) => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                // 'Authorization': `Bearer ${token}`
                });
            this.http.post<any>(`${apiBaseUrl}/api/orchestrators/MonitorFlights`, {
                'Take': 30,
                'Skip': 0
            }).subscribe(data => {
                this.monitorFunctionData = data;
            });
        });
    }

    stopMonitorClicked() {
        this.easyAuth.getAuthToken().then((token) => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'X-ZUMO-AUTH': token
                // 'Authorization': `Bearer ${token}`
                });

            const url = this.monitorFunctionData.terminatePostUri.replace('{text}', encodeURIComponent('terminated by user'));
            this.http.post<any>(url, null).subscribe(data => {
            });
        });
    }

    handleFlights(data) {
        if (!this.mycanvaslayer.flightManager) {
            console.log('flightManager not yet initialized; incoming data will not be processed');
            return;
        }
        const flights = data[0];
        this.mycanvaslayer.flightManager.flightDataReceived(2000, flights.map(f => {
            return {
                time: f.time,
                icao: f.icao24,
                lat: f.Lat,
                long: f.Lon};
            }), undefined, undefined, flights[0].time );
    }
}
