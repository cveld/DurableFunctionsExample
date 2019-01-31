import { fabric } from 'fabric';
import { MapService, ILatLong, IPoint } from 'angular-maps';
// Code copied from https://github.com/aspnet/AzureSignalR-samples/tree/master/samples/FlightMap
export class FlightManager {
    curTimestamp: number;
    isInit = false;
    speedup: number;
    updateDuration: number;
    aircraftDict: Map<string, {
        obj: fabric.Image,
        loc: any}>;

    constructor(private _fabric: fabric.Canvas, private _mapService: MapService) {
    }

    //
    flightDataReceived(duration, aircrafts, ind, serverTimestamp, timestamp: number) {
        this.speedup = (timestamp - this.curTimestamp) / duration;
        this.curTimestamp = timestamp;
        this.updateDuration = duration;

        if (!this.isInit) {
            this.initAircrafts(aircrafts);
            this.isInit = true;
        } else {
            this.updateAircrafts(aircrafts);
        }
    }

// function updateVisitors(totalVisitors) {
//     $("#counter").text(`${totalVisitors} joined`);
// }


    addAircrafts(aircraftList) {
        fabric.Image.fromURL('assets/plane-white.png', (img) => {
            const addedAircrafts = aircraftList.filter(a => !(a.icao in this.aircraftDict)).forEach(a => {
                const icao = a.icao;
                const loc = new Microsoft.Maps.Location(a.lat, a.long);
                this.loc2pt(loc).then(pt => {
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
                        img: newImg,
                        key: icao,
                        loc: loc
                    };
                });
            });
        });
    }

    initAircrafts(aircraftList) {
        this.clearAllAircrafts();
        this.addAircrafts(aircraftList);
    }

    clearAllAircrafts() {
        for (const key in this.aircraftDict) {
            if (this.aircraftDict.hasOwnProperty(key)) {
                this._fabric.remove(this.aircraftDict[key].obj);
            }
        }
        this.aircraftDict = new Map<string, {
            obj: fabric.Image,
            loc: any}>();
    }


    clearAircrafts(newAircraftList) {
        const curKeys = {};
        const l = newAircraftList.length;
        for (let i = 0; i < l; i++) {
            const key = newAircraftList[i]['icao'];
            curKeys[key] = 1;
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

    prepareMoveData(newAircraftList) {
        return newAircraftList.map(a => {
            const from = this.aircraftDict[a.icao].loc;
            const to = new Microsoft.Maps.Location(a.lat, a.long);
            const angle = this.compDegAnglePt(this.loc2pt(from), this.loc2pt(to));
            return {
                icao: a.icao,
                from: from,
                to: to,
                angle: angle
            };
        });
    }

    async moveAircrafts(moveData) {
    const startTime = new Date().getTime();
    const globalStart = startTime;

    const animate = () => {
        if (startTime !== globalStart) {
            return;
        }
        const curTime = new Date().getTime();
        const elapsedTime = curTime - startTime;
        if (elapsedTime > this.updateDuration) {
            return;
        }
        // showTime(curTimestamp + elapsedTime * speedup);

        const promises: Array<Promise<void>> = [];
        // update location
        moveData.forEach(d => {
            const loc = this.interpolatePosition(d.from, d.to, curTime, startTime, this.updateDuration);
            promises.push(this.loc2pt(loc).then(pt => {
                this.aircraftDict[d.icao].obj.left = pt.x;
                this.aircraftDict[d.icao].obj.top = pt.y;
                this.aircraftDict[d.icao].obj.angle = d.angle;
                this.aircraftDict[d.icao].obj.setCoords();
                this.aircraftDict[d.icao].loc = loc;
            }));
        });

        Promise.all(promises).then(() => {
            // next frame
            fabric.util.requestAnimFrame(animate);
            this._fabric.renderAll();
        });
    };

    animate();
}

    updateAircrafts(newAircraftList) {
        if (!this._fabric) {
            return;
        }
        this.addAircrafts(newAircraftList);
        this.clearAircrafts(newAircraftList);
        this.moveAircrafts(this.prepareMoveData(newAircraftList));
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

    loc2pt(loc: ILatLong) {
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
