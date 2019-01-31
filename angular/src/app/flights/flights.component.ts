import { Component, OnInit } from '@angular/core';
import { Marker, IMapOptions, MarkerTypeId, IBox, IMarkerIconInfo, ILatLong, MapTypeId, IMarkerOptions } from 'angular-maps';
import { SignalrinfoService } from '../shared';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-flights',
    templateUrl: './flights.component.html',
    styleUrls: ['./flights.component.scss']
})
export class FlightsComponent implements OnInit {
    private subscriptions: Array<Subscription> = new Array<Subscription>();

    constructor(private signalrinfoService: SignalrinfoService) {
        this._markers.set('mymarker', { latitude: 29.714994, longitude: -95.46244});
        for (let i = 0; i < 4; i++) {
            // const icon = Object.assign({}, this._iconInfo, { rotation: Math.random() * 360 });
            // icon.scaledSize = { width: 24, height: 24 };
            this._markers.set(i.toString(), {
                latitude: 52.092876 + Math.random() - Math.random(),
                longitude: 5.104480 + Math.random() - Math.random(),
                icon: this.getIcon(i * 90)
            });
        }

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

    _icon: IMarkerIconInfo = {
        id: 'mymarker',
        markerType: MarkerTypeId.FontMarker,
        fontName: 'FontAwesome',
        fontSize: 4,
        color: 'red',
        markerOffsetRatio: { x: 0.5, y: 1 },
        text: '\uF267'
      };

    public _iconInfo2: IMarkerIconInfo = {
        markerType: MarkerTypeId.RotatedImageMarker,
        rotation: 45,
        markerOffsetRatio: { x: 0.5, y: 0.5 },
        // drawingOffset: { x: 12, y: 0 },
        // points: [
        // { x: 5, y: 20 },
        // { x: 12, y: 15 },
        // { x: 19, y: 20 },
        // { x: 12, y: 0 }
        // ],
        url: '/assets/plane-white.png',
        // color: '#0f0',
        // size: { width: 24, height: 24 }
        scaledSize: { width: 24, height: 24 }
    };

    public _markers: Map<string, any> = new Map<string, any>();
    _markersarray: Array<IMarkerOptions> = new Array<IMarkerOptions>();
    private cachedIcons: Map<string, IMarkerIconInfo> = new Map<string, IMarkerIconInfo>();
    counter = 0;

    ngOnInit() {
    }

    addclicked() {
        // console.log(Marker.);
        this._markers.set('0', {
            latitude: 52.092876 + Math.random() - Math.random(),
            longitude: 5.104480 + Math.random() - Math.random(),
            icon: this.getIcon(90) // Math.random() * 360)
        });
    }
    add2clicked() {
        this._markers.set('1', {
            latitude: 52.092876 + Math.random() - Math.random(),
            longitude: 5.104480 + Math.random() - Math.random(),
            icon: this.getIcon(Math.random() * 360)
        });
    }

    getIcon(rotation: number): IMarkerIconInfo {
        const id = Math.floor(rotation).toString();
        if (false && this.cachedIcons.has(id)) {
            return this.cachedIcons[id];
        }
        const obj = {
            id: id,
            markerType: MarkerTypeId.RotatedImageMarker,
            rotation: Math.floor(rotation),
            markerOffsetRatio: { x: 0.5, y: 0.5 },
            // tslint:disable-next-line:max-line-length
            url: 'data:image/png;base64,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' // '/assets/plane-white.png',
            // scaledSize: { width: 24, height: 24 },
            // scale: 1.0
        };
        this.cachedIcons.set(id, obj);
        return obj;
    }

    guidGenerator() {
        const S4 = function() {
           // tslint:disable-next-line:no-bitwise
           return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
    }

    handleFlights(data) {
        const flights = data[0];
        flights.forEach ((flight) => {
            this.counter++;
            // const icon = Object.assign({}, this._iconInfo, { rotation: flight.heading });
            // if (this._markers.has(flight.icao24)) {
            let rotation = flight.heading - 90;
            if (rotation < 0) {
                rotation += 360;
            }
            // heading -> rotation:
            // 0 -> 90
            // 90 -> 0
            // 180 -> 270  (-90)
            // 270 -> 180  (-180)
                this._markers.set(flight.icao24, {
                    latitude: +flight.Lat,
                    longitude: +flight.Lon,
                    icon: this.getIcon(rotation)
                });
            // }
        });

        const array = [];
        this._markers.forEach((value) => {
            array.push({
                position: {
                    latitude: value.latitude,
                    longitude: value.longitude
                },
                icon: value.icon
            });
        });
        this._markersarray = array;
    }



    _click() {
        console.log('clicked!');
    }
}
