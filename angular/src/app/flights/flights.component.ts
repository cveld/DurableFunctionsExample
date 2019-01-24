import { Component, OnInit } from '@angular/core';
import { IMapOptions, MarkerTypeId, IBox, IMarkerIconInfo, ILatLong } from 'angular-maps';

@Component({
    selector: 'app-flights',
    templateUrl: './flights.component.html',
    styleUrls: ['./flights.component.scss']
})
export class FlightsComponent implements OnInit {
    constructor() {
        this._markers.push({ latitude: 29.714994, longitude: -95.46244});
        for (let i = 0; i < 20; i++) {
            this._markers.push({
                latitude: 29.714994 + Math.random() - Math.random(),
                longitude: -95.46244 + Math.random() - Math.random()
            });
        }
    }

    public _options: IMapOptions = {
        disableBirdseye: false,
        disableStreetside: false,
        navigationBarMode: 1,
        zoom: 6
    };
    public _markerTypeId = MarkerTypeId;
            // a little trick so we can use enums in the template...

    public _box: IBox = {
        maxLatitude: 32,
        maxLongitude: -92,
        minLatitude: 29,
        minLongitude: -98
    };

    public _iconInfo: IMarkerIconInfo = {
        markerType: MarkerTypeId.CanvasMarker,
        rotation: 45,
        drawingOffset: { x: 12, y: 0 },
        points: [
        { x: 5, y: 20 },
        { x: 12, y: 15 },
        { x: 19, y: 20 },
        { x: 12, y: 0 }
        ],
        color: '#f00',
        size: { width: 24, height: 24 }
    };

    public _markers: Array<ILatLong> = new Array<ILatLong>();

    ngOnInit() {
    }

    _click() {
        console.log('clicked!');
    }
}
