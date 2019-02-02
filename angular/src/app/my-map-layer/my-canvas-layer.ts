import {
    Directive, SimpleChange, Input, Output, OnDestroy, OnChanges,
    EventEmitter, ContentChild, AfterContentInit, ViewContainerRef, NgZone,
    SimpleChanges
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
        Layer, LayerService, CanvasOverlay, ILatLong, ILabelOptions, IPolylineOptions, IPolylineEvent,
        MapService, IPoint, ILayerOptions, Polyline, ISize, IMarkerOptions } from 'angular-maps';
import { MapLabel } from 'angular-maps/src/models/map-label';
import { fabric } from 'fabric';
import { FlightManager } from '../flights/microsoftflightcode';
import { timeout } from 'q';

/**
 * internal counter to use as ids for polylines.
 */
let layerId = 1000000;

/**
 * MapPolylineLayerDirective performantly renders a large set of polyline on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polyline-layer [PolygonOptions]="_polyline"></x-map-polyline-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
@Directive({
    // tslint:disable-next-line:directive-selector
    selector: 'my-canvas-layer'
})
export class MyCanvasLayerDirective implements OnDestroy, OnChanges, AfterContentInit {

    ///
    /// Field declarations
    ///
    public flightManager: FlightManager;
    private _id: number;
    private _layerPromise: Promise<Layer>;
    private _service: LayerService;
    private _canvas: CanvasOverlay;
    public _fabric: fabric.Canvas;
    private _labels: Array<{loc: ILatLong, title: string}> = new Array<{loc: ILatLong, title: string}>();
    private _tooltip: MapLabel;
    private _tooltipSubscriptions: Array<Subscription> = new Array<Subscription>();
    private _tooltipVisible = false;
    private _defaultOptions: ILabelOptions = {
        fontSize: 11,
        fontFamily: 'sans-serif',
        strokeWeight: 2,
        strokeColor: '#000000',
        fontColor: '#ffffff'
    };
    private _streaming = false;
    private _polylines: Array<IPolylineOptions> = new Array<IPolylineOptions>();
    private _polylinesLast: Array<IPolylineOptions> = new Array<IPolylineOptions>();
    private _markers: Array<IMarkerOptions> = new Array<IMarkerOptions>();
    private _markersLast: Array<IMarkerOptions> = new Array<IMarkerOptions>();

    /**
     * Set the maximum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
     */
    @Input() public LabelMaxZoom: number = Number.MAX_SAFE_INTEGER;

    /**
     * Set the minimum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
     */
    @Input() public LabelMinZoom = -1;

    /**
     * Sepcifies styleing options for on-map polyline labels.
     *
     */
    @Input() public LabelOptions: ILabelOptions;

    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     */
    @Input() public LayerOffset: IPoint = null;

    /**
     * An array of polyline options representing the polylines in the layer.
     *
     */
    @Input()
        public get PolylineOptions(): Array<IPolylineOptions> { return this._polylines; }
        public set PolylineOptions(val: Array<IPolylineOptions>) {
            if (this._streaming) {
                this._polylinesLast.push(...val.slice(0));
                this._polylines.push(...val);
            } else {
                this._polylines = val.slice(0);
            }
        }

    @Input()
    public get MarkerOptions(): Array<IMarkerOptions> { return this._markers; }
    public set MarkerOptions(val: Array<IMarkerOptions>) {
            if (this._streaming) {
                this._markersLast.push(...val.slice(0));
                this._markers.push(...val);
            } else {
                this._markers = val.slice(0);
            }
        }
    /**
     * Whether to show the polylines titles as the labels on the polylines.
     *
     */
    @Input() public ShowLabels = false;

    /**
     * Whether to show the titles of the polylines as the tooltips on the polylines.
     *
     */
    @Input() public ShowTooltips = true;

    /**
     * Sets whether to treat changes in the PolylineOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolylineOptions will be incrementally drawn on the map as opposed to replace the polylines on the map.
     *
     */
    @Input()
        public get TreatNewPolylineOptionsAsStream(): boolean { return this._streaming; }
        public set TreatNewPolylineOptionsAsStream(val: boolean) { this._streaming = val; }

    /**
     * Sets the visibility of the marker layer
     */
    @Input() public Visible: boolean;

    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     */
    @Input() public ZIndex = 0;

    ///
    /// Delegates
    ///

    /**
     * This event emitter gets emitted when the user clicks a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    @Output() public PolylineClick: EventEmitter<IPolylineEvent> = new EventEmitter<IPolylineEvent>();

    /**
     * This event is fired when the DOM dblclick event is fired on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    @Output() PolylineDblClick: EventEmitter<IPolylineEvent> = new EventEmitter<IPolylineEvent>();

    /**
     * This event is fired when the DOM mousemove event is fired on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    @Output() PolylineMouseMove: EventEmitter<IPolylineEvent> = new EventEmitter<IPolylineEvent>();

    /**
     * This event is fired on mouseout on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    @Output() PolylineMouseOut: EventEmitter<IPolylineEvent> = new EventEmitter<IPolylineEvent>();

    /**
     * This event is fired on mouseover on a polyline in a layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    @Output() PolylineMouseOver: EventEmitter<IPolylineEvent> = new EventEmitter<IPolylineEvent>();



    ///
    /// Property declarations
    ///

    /**
     * Gets the id of the polyline layer.
     *
     * @readonly
     * @memberof MapPolylineLayerDirective
     */
    public get Id(): number { return this._id; }

    ///
    /// Constructor
    ///

    /**
     * Creates an instance of MapPolylineLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     */
    constructor(
        private _layerService: LayerService,
        private _mapService: MapService,
        private _zone: NgZone) {
        this._id = layerId++;
    }

    ///
    /// Public methods
    ///

    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
     */
    public ngAfterContentInit() {
        const layerOptions: ILayerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective: any = {
                Id : this._id,
                Visible: this.Visible,
                LayerOffset: this.LayerOffset,
                ZIndex: this.ZIndex
            };
            this._layerService.AddLayer(fakeLayerDirective);
            this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);

            Promise.all([
                    this._layerPromise,
                    this._mapService.CreateCanvasOverlay(el => {
                        // this.DrawLabels(el);
                        if (!this._fabric) {
                            this._fabric = new fabric.Canvas(el, {
                                renderOnAddRemove: false,
                                selection: false
                           });
                           this.flightManager = new FlightManager(this._fabric, this._mapService);
                        //    const rect = new fabric.Rect({
                        //     left: 100,
                        //     top: 50,
                        //     width: 100,
                        //     height: 100,
                        //     fill: 'green'
                        //   });
                        //   this._fabric.add(rect);
                        }

                        // this.DrawTest();
                        const promises = this.flightManager.refreshPositions();
                        promises.then(() => {
                             this._fabric.renderAll();
                        });
                        // this.runxtimes(5, 100, this.callbackfunc);
                    })
                ]).then(values => {
                    values[0].SetVisible(this.Visible);
                    this._canvas = values[1];
                    this._canvas._canvasReady.then(b => {
                    });
                });
            this._service = this._layerService;
        });
    }

    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     */
    public ngOnDestroy() {
        this._fabric.dispose();
        this._tooltipSubscriptions.forEach(s => s.unsubscribe());
        this._layerPromise.then(l => {
            l.Delete();
        });
        if (this._canvas) { this._canvas.Delete(); }
    }

    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     */
    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._layerPromise.then(l => l.SetVisible(this.Visible));
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange)
        ) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if ((changes['ShowLabels'] && !changes['ShowLabels'].firstChange) ||
            (changes['LabelMinZoom'] && !changes['LabelMinZoom'].firstChange) ||
            (changes['LabelMaxZoom'] && !changes['LabelMaxZoom'].firstChange)
        ) {
            if (this._canvas) {
                this._canvas.Redraw(true);
            }
        }
    }

    /**
     * Obtains a string representation of the Layer Id.
     * @returns - string representation of the layer id.
     */
    public toString(): string { return 'MyCanvasLayer-' + this._id.toString(); }


}
