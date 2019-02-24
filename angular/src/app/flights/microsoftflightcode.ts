import { fabric } from 'fabric';
import { MapService, ILatLong, IPoint } from 'angular-maps';
// Code copied from https://github.com/aspnet/AzureSignalR-samples/tree/master/samples/FlightMap
export class FlightManager {
    curTimestamp: number;
    isInit = false;
    speedup: number;
    updateDuration: number;
    aircraftDict: {[index: string]: {
        time: number,
        obj: fabric.Image,
        loc: any }
    } = {};
    sessionCounter = 0;

    constructor(private _fabric: fabric.Canvas, private _mapService: MapService) {
        this.testLongLat();
    }

    async testLongLat() {
        await this.addAircrafts([
            {
                icao: '1',
                lat: 52.092876,
                long: 5.104480
            }
        ], -1);
        this._fabric.renderAll();
    }

    //
    flightDataReceived(duration, aircrafts: Array<any>, ind, serverTimestamp, timestamp: number) {
        const thisSession = this.sessionCounter++;
        this.speedup = (timestamp - this.curTimestamp) / duration;
        this.curTimestamp = timestamp;
        this.updateDuration = duration;

        if (!this.isInit) {
            this.initAircrafts(aircrafts, thisSession);
            this.isInit = true;
        } else {
            console.log(`[${thisSession}] ${timestamp}`);
            this.updateAircrafts(aircrafts, thisSession);
        }
    }

// function updateVisitors(totalVisitors) {
//     $("#counter").text(`${totalVisitors} joined`);
// }


    addAircrafts(aircraftList, thisSession) {
        const promise = new Promise((resolve, reject) => {
            fabric.Image.fromURL('assets/plane-white.png', (img) => {
                const promises = [];
                const addedAircrafts = aircraftList.filter(a => !(a.icao in this.aircraftDict)).forEach(a => {
                    const icao = a.icao;
                    const loc = new Microsoft.Maps.Location(a.lat, a.long);
                    promises.push(this.loc2pt(loc).then(pt => {
                        const newImg = new fabric.Image(img.getElement(), {
                            left: pt.x,
                            top: pt.y,
                            angle: 0,
                            opacity: 1.0,
                            originX: 'center',
                            originY: 'center'
                        });

                        this._fabric.add(newImg);
                        this.aircraftDict[icao] = {
                            obj: newImg,
                            loc: loc,
                            time: a.time
                        };
                    }));
                });
                Promise.all(promises).then(() => {
                    resolve();
                });
            }); // fabric.Image.fromURL
        });
        return promise;
    }

    async initAircrafts(aircraftList, thisSession) {
        this.clearAllAircrafts(thisSession);
        await this.addAircrafts(aircraftList, thisSession);
    }

    clearAllAircrafts(thisSession) {
        for (const key in this.aircraftDict) {
            if (this.aircraftDict.hasOwnProperty(key)) {
                this._fabric.remove(this.aircraftDict[key].obj);
            }
        }
        this.aircraftDict = {};
    }


    clearAircrafts(newAircraftList) {
        const curKeys = {};
        const l = newAircraftList.length;
        for (let i = 0; i < l; i++) {
            const key = newAircraftList[i]['icao'];
            curKeys[key] = 1;

            // remove airplanes on the ground:
            if (newAircraftList[i]['Gnd'] === true && key in this.aircraftDict) {
                this._fabric.remove(this.aircraftDict[key].obj);
                delete this.aircraftDict[key];
            }
        }

        // clear aircrafts not in list any more
        for (const key in this.aircraftDict) {
            if (!(key in curKeys)) {
                this._fabric.remove(this.aircraftDict[key].obj);
                delete this.aircraftDict[key];
            }
        }
    }

    async prepareMoveData(newAircraftList, thisSession) {
        console.log(`[${thisSession}] ${newAircraftList[0].time}`);
        const promises = [];
        const result = newAircraftList.map(a => {
            const currentAircraftDict = this.aircraftDict[a.icao];
            if (!currentAircraftDict) {
                console.log(`[${thisSession}] no entry for ${a.icao} during prepareMoveData`);
                return undefined;
            }
            let from = currentAircraftDict.loc;
            const to = new Microsoft.Maps.Location(a.lat, a.long);
            if (a.time < currentAircraftDict.time) {
                from = to;
            }
            currentAircraftDict.time = a.time;
            return Promise.all([this.loc2pt(from), this.loc2pt(to)]).then(([frompt, topt]) => {
                const angle = this.compDegAnglePt(frompt, topt);
                return {
                    icao: a.icao,
                    from: from,
                    to: to,
                    angle: angle
                };
            });
        });

        const resultall = await Promise.all(result);
        return resultall;
    }

    strippx(s: string): string {
        if (!s || s === '') {
            return s;
        }
        return s.substring(0, s.length - 2);
    }

    async moveAircrafts(moveData, thisSession) {
        const startTime = new Date().getTime();
        const globalStart = startTime;

        const animate = () => {
            if (startTime !== globalStart) {
                return;
            }
            // while the user is dragging the canvas, the canvas css top and left is used to move the graphics.
            // we need to compensate our drawing for that:
            const currentTop = this.strippx(this._fabric.getContext().canvas.style.top);
            const currentLeft = this.strippx(this._fabric.getContext().canvas.style.left);

            const curTime = new Date().getTime();
            const elapsedTime = curTime - startTime;
            if (elapsedTime > this.updateDuration) {
                return;
            }
            // showTime(curTimestamp + elapsedTime * speedup);

            const promises: Array<Promise<void>> = [];
            // update location
            moveData.forEach(d => {
                if (!!d) {
                    const loc = this.interpolatePosition(d.from, d.to, curTime, startTime, this.updateDuration);
                    promises.push(this.loc2pt(loc).then(pt => {
                        if (!!this.aircraftDict[d.icao]) {
                            this.aircraftDict[d.icao].obj.left = pt.x - +currentLeft;
                            this.aircraftDict[d.icao].obj.top = pt.y - +currentTop;
                            this.aircraftDict[d.icao].obj.angle = d.angle;
                            this.aircraftDict[d.icao].obj.setCoords();
                            this.aircraftDict[d.icao].loc = loc;
                        } else {
                            console.log(`[${thisSession}] ${d.icao} not found in aircraftDict during moveAircrafts`);
                        }
                    }));
                }
            });

            Promise.all(promises).then(() => {
                // next frame
                fabric.util.requestAnimFrame(animate);
                this._fabric.renderAll();
            });
        };

        animate();
    }

    logloc2pt() {
        for (const key in this.aircraftDict) {
            if (this.aircraftDict.hasOwnProperty(key)) {
                this.loc2pt(this.aircraftDict[key].loc).then(pt => {
                    console.log(`log: ${pt.x}, ${pt.y}`);
                });
            }
        }
    }

    async refreshPositions() {
        const promises = [];
        for (const key in this.aircraftDict) {
            if (this.aircraftDict.hasOwnProperty(key)) {
                promises.push(this.loc2pt(this.aircraftDict[key].loc).then(pt => {
                    this.aircraftDict[key].obj.left = pt.x;
                    this.aircraftDict[key].obj.top = pt.y;
                }));
            }
        }
        return Promise.all(promises);
    }

    async updateAircrafts(newAircraftList, thisSession) {
        console.log(`[${thisSession}] updateAircrafts entry`);
        if (!this._fabric) {
            return;
        }
        await this.addAircrafts(newAircraftList, thisSession);
        // this.clearAircrafts(newAircraftList);
        const moveData = await this.prepareMoveData(newAircraftList, thisSession);
        console.log(`[${thisSession}] ${new Date().getTime()}`);
        this.moveAircrafts(moveData, thisSession);
    }

    compDegAngle(src, dest) {
        const latVec = dest.latitude - src.latitude;
        const longVec = dest.longitude - src.longitude;
        const x = longVec;
        const y = -latVec;
        const eps = 1e-6;
        if (Math.abs(latVec) < eps) {
            if (longVec > 0) {
                return 0;
            }
            return 180;
        }
        if (Math.abs(longVec) < eps) {
            if (latVec < 0.) {
                return 90;
            } else {
                return -90;
            }

        }

        const r = Math.sqrt(x * x + y * y);
        const cos = x / r;
        let angle = Math.acos(cos);
        if (y < 0) {
            angle = Math.PI * 2 - angle;
        }
        return angle * 180 / Math.PI;
    }

    compDegAnglePt(pt1, pt2) {
        const x = pt2.x - pt1.x;
        const y = pt2.y - pt1.y;
        const eps = 1e-6;
        if (Math.abs(pt2.y - pt1.y) < eps) {
            if (pt2.x - pt1.x > 0) {
                return 0;
            }
            return 180;
        }
        if (Math.abs(pt2.x - pt1.x) < eps) {
            if (pt2.y - pt1.y < 0.) {
                return -90;
            } else {
                return 90;
            }

        }

        const r = Math.sqrt(x * x + y * y);
        const cos = x / r;
        let angle = Math.acos(cos);
        if (y < 0) {
            angle = Math.PI * 2 - angle;
        }
        return angle * 180 / Math.PI;
    }

    loc2pt(loc: ILatLong): Promise<IPoint> {
        return this._mapService.LocationToPoint(loc);
    }

    interpolatePosition(src: ILatLong, dest: ILatLong, curTimestamp, startTimeStamp, duration) {
        if (duration === 0) {
            return dest;
        }
        const latVec = dest.latitude - src.latitude;
        const longVec = dest.longitude - src.longitude;

        const ratio = (curTimestamp - startTimeStamp) / duration;
        const curLat = src.latitude + latVec * ratio;
        const curLong = src.longitude + longVec * ratio;

        return new Microsoft.Maps.Location(curLat, curLong);
    }

} // class
