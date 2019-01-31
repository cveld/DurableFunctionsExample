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
    private flightManager: FlightManager;
    private _id: number;
    private _layerPromise: Promise<Layer>;
    private _service: LayerService;
    private _canvas: CanvasOverlay;
    private _fabric: fabric.Canvas;
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
            }
            else {
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
     *
     * @memberof MapPolylineLayerDirective
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
                        this.DrawLabels(el);
                        if (!this._fabric) {
                            this._fabric = new fabric.Canvas(el, {
                                renderOnAddRemove: false,
                                selection: false
                           });
                           this.flightManager = new FlightManager(this._fabric, this._mapService);
                        }
                        this.DrawTest();
                        this._fabric.renderAll();
                    })
                ]).then(values => {
                    values[0].SetVisible(this.Visible);
                    this._canvas = values[1];
                    this._canvas._canvasReady.then(b => {
                        this._tooltip = this._canvas.GetToolTipOverlay();
                        this.ManageTooltip(this.ShowTooltips);
                    });
                    if (this.PolylineOptions) {
                        this._zone.runOutsideAngular(() => this.UpdatePolylines());
                    }
                });
            this._service = this._layerService;
        });
    }

    private DrawTest(): void {
                    // const labels = this._labels.map(x => x.title);
                    this._mapService.LocationsToPoints(this._markers.map(x => x.position)).then(locs => {
                        const size: ISize = this._mapService.MapSize;
                        for (let i = 0, len = locs.length; i < len; i++) {
                            // Don't draw the point if it is not in view. This greatly improves performance when zoomed in.
                            if (locs[i].x >= 0 && locs[i].y >= 0 && locs[i].x <= size.width && locs[i].y <= size.height) {
                                const text = new fabric.Text('hello world', { left: locs[i].x, top: locs[i].y });
                                this._fabric.add(text);
                            }
                        }
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

    private UpdateTest() {
        if (!this._fabric) {
            return;
        }

        // create a rectangle object
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 20,
            height: 20
        });

        // "add" rectangle onto canvas
        this._fabric.add(rect);
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     */
    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        if (changes['MarkerOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdateTest();
                this.UpdateMarkers();
                if (!!this._fabric) {
                    this._fabric.renderAll();
                }
            });
        }

        if (changes['PolylineOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdatePolylines();
            });
        }
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
        if (changes['ShowTooltips'] && this._tooltip) {
            this.ManageTooltip(changes['ShowTooltips'].currentValue);
        }
    }

    /**
     * Obtains a string representation of the Layer Id.
     * @returns - string representation of the layer id.
     */
    public toString(): string { return 'MapPolylineLayer-' + this._id.toString(); }

    ///
    /// Private methods
    ///

    /**
     * Adds various event listeners for the polylines.
     *
     * @param p - the polyline for which to add the event.
     *
     */
    private AddEventListeners(p: Polyline): void {
        const handlers = [
            { name: 'click', handler: (ev: MouseEvent) => this.PolylineClick.emit({Polyline: p, Click: ev}) },
            { name: 'dblclick', handler: (ev: MouseEvent) => this.PolylineDblClick.emit({Polyline: p, Click: ev}) },
            { name: 'mousemove', handler: (ev: MouseEvent) => this.PolylineMouseMove.emit({Polyline: p, Click: ev}) },
            { name: 'mouseout', handler: (ev: MouseEvent) => this.PolylineMouseOut.emit({Polyline: p, Click: ev}) },
            { name: 'mouseover', handler: (ev: MouseEvent) => this.PolylineMouseOver.emit({Polyline: p, Click: ev}) }
        ];
        handlers.forEach((obj) => p.AddListener(obj.name, obj.handler));
    }

    /**
     * Draws the polyline labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     */
    private DrawLabels(el: HTMLCanvasElement): void {
        if (this.ShowLabels) {
            this._mapService.GetZoom().then(z => {
                if (this.LabelMinZoom <= z && this.LabelMaxZoom >= z) {
                    const ctx: CanvasRenderingContext2D = el.getContext('2d');
                    const labels = this._labels.map(x => x.title);
                    this._mapService.LocationsToPoints(this._labels.map(x => x.loc)).then(locs => {
                        const size: ISize = this._mapService.MapSize;
                        for (let i = 0, len = locs.length; i < len; i++) {
                            // Don't draw the point if it is not in view. This greatly improves performance when zoomed in.
                            if (locs[i].x >= 0 && locs[i].y >= 0 && locs[i].x <= size.width && locs[i].y <= size.height) {
                                this.DrawText(ctx, locs[i], labels[i]);
                            }
                        }
                    });
                }
            });
        }
    }

    /**
     * Draws the label text at the appropriate place on the canvas.
     * @param ctx - Canvas drawing context.
     * @param loc - Pixel location on the canvas where to center the text.
     * @param text - Text to draw.
     */
    private DrawText(ctx: CanvasRenderingContext2D, loc: IPoint, text: string) {
        let lo: ILabelOptions = this.LabelOptions;
        if (lo == null && this._tooltip) { lo = this._tooltip.DefaultLabelStyle; }
        if (lo == null) { lo = this._defaultOptions; }

        ctx.strokeStyle = lo.strokeColor;
        ctx.font = `${lo.fontSize}px ${lo.fontFamily}`;
        ctx.textAlign = 'center';
        const strokeWeight: number = lo.strokeWeight;
        if (text && strokeWeight && strokeWeight > 0) {
                ctx.lineWidth = strokeWeight;
                ctx.strokeText(text, loc.x, loc.y);
        }
        ctx.fillStyle = lo.fontColor;
        ctx.fillText(text, loc.x, loc.y);
    }

    /**
     * Manages the tooltip and the attachment of the associated events.
     *
     * @param show - True to enable the tooltip, false to disable.
     */
    private ManageTooltip(show: boolean): void {
        if (show && this._canvas) {
            // add tooltip subscriptions
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
            this._tooltipSubscriptions.push(this.PolylineMouseMove.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    const loc: ILatLong = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('position', loc);
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOver.asObservable().subscribe(e => {
                if (e.Polyline.Title && e.Polyline.Title.length > 0) {
                    const loc: ILatLong = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('text', e.Polyline.Title);
                    this._tooltip.Set('position', loc);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOut.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    this._tooltip.Set('hidden', true);
                    this._tooltipVisible = false;
                }
            }));
        } else {
            // remove tooltip subscriptions
            this._tooltipSubscriptions.forEach(s => s.unsubscribe());
            this._tooltipSubscriptions.splice(0);
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
        }
    }

    private UpdateMarkers(): void {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            // this._mapService.LocationToPoint()

            if (this._canvas) { this._canvas.Redraw(!this._streaming); }
        });
    }

    /**
     * Sets or updates the polyliness based on the polyline options. This will place the polylines on the map
     * and register the associated events.
     *
     * @memberof MapPolylineLayerDirective
     * @method
     */
    private UpdatePolylines(): void {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const polylines: Array<IPolylineOptions> = this._streaming ? this._polylinesLast.splice(0) : this._polylines;
            if (!this._streaming) { this._labels.splice(0); }

            // generate the promise for the polylines
            const lp: Promise<Array<Polyline|Array<Polyline>>> = this._service.CreatePolylines(l.GetOptions().id, polylines);

            // set polylines once promises are fullfilled.
            lp.then(p => {
                const y: Array<Polyline> = new Array<Polyline>();
                p.forEach(poly => {
                    if (Array.isArray(poly)) {
                        let title = '';
                        const centroids: Array<ILatLong> = new Array<ILatLong>();
                        poly.forEach(x => {
                            y.push(x);
                            this.AddEventListeners(x);
                            centroids.push(x.Centroid);
                            if (x.Title != null && x.Title.length > 0 && title.length === 0) { title = x.Title; }
                        });
                        this._labels.push({loc: Polyline.GetPolylineCentroid(centroids), title: title});
                    } else {
                        y.push(poly);
                        if (poly.Title != null && poly.Title.length > 0) { this._labels.push({loc: poly.Centroid, title: poly.Title}); }
                        this.AddEventListeners(poly);
                    }
                });
                this._streaming ? l.AddEntities(y) : l.SetEntities(y);
                if (this._canvas) { this._canvas.Redraw(!this._streaming); }
            });
        });
    }

}
