import { NavMesh, Point, PolyPoints, buildPolysFromGridMap } from 'navmesh';
import { FIELD_MAP_DATA, TileType } from '../../../shared/constants';
import * as SAT from 'sat';

export default class Field {

    private landNav!:NavMesh;
    private flyNav!:NavMesh;
    private buildingPolys!:SAT.Polygon[];
    private waterPolys:SAT.Polygon[] = [];

    private static readonly response = new SAT.Response();
    private static readonly tempPoint = new SAT.Vector();

    constructor() {
        // Let's use `buildPolysFromGridMap` in reverse to generate the water rectangles.
        const waterRects = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, tt => tt == TileType.WATER, 0);
        for (const rect of waterRects) {
            this.waterPolys.push(new SAT.Polygon(new SAT.Vector(), rect.map(p => new SAT.Vector(p.x, p.y))));
        }
    }

    initialize(buildings:SAT.Polygon[]) {
        this.buildingPolys = buildings;
        this.regenerate();
    }

    removeBuilding(geom:SAT.Polygon) {
        const i = this.buildingPolys.indexOf(geom);
        if (i >= 0) {
            this.buildingPolys.splice(i, 1);
            this.regenerate();
        }
    }

    regenerate() {
        if (this.landNav) this.landNav.destroy();
        if (this.flyNav) this.flyNav.destroy();

        const shrinkAmount = 0.25;
        const landPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, this.isWalkable.bind(this, false), shrinkAmount);
        splitPolys(landPolys);
        const flyPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, this.isWalkable.bind(this, true), shrinkAmount);
        splitPolys(flyPolys);

        this.landNav = new NavMesh(landPolys, shrinkAmount);
        this.flyNav = new NavMesh(flyPolys, shrinkAmount);
    }

    getPath(from:Point, to:Point, isFlying:boolean) {
        return (isFlying ? this.flyNav : this.landNav).findPath(from, to);
    }

    collideWalls(circle:SAT.Circle, isFlying:boolean) {
        if (!isFlying) this.pushCircle(circle, this.waterPolys);
        this.pushCircle(circle, this.buildingPolys);
    }

    private pushCircle(circle:SAT.Circle, polys:SAT.Polygon[]) {
        for (const p of polys) {
            Field.response.clear();
            if (SAT.testPolygonCircle(p, circle, Field.response)) {
                circle.pos.add(Field.response.overlapV);
            }
        }
    }

    private isWalkable(flying:boolean, type:TileType, x:number, y:number):boolean {
        let result = flying || type != TileType.WATER;
        if (result) {
            Field.tempPoint.x = x + 0.5;
            Field.tempPoint.y = y + 0.5;
            for (const b of this.buildingPolys) {
                if (SAT.pointInPolygon(Field.tempPoint, b)) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    }

}

/**
 * Since 'navmesh' uses simple A* and uses number of polygons stepped as distance, not real distance,
 * the resulting path can be non-optimal. We improve on that by simply splitting big polygons into smaller ones.
 * We only split vertically, as splitting horizontally would create a situation where 'cell' selected by A*
 * isn't actually the ideal one, and the funnel algorithm that optimizes the path afterwards can't get out of
 * the cell, creating awkward result.
 */
function splitPolys(polys:PolyPoints[]):void {
    const maxSize = 6;
    for (let i = 0; i < polys.length; i++) {
        const rect = polys[i];
        while (rect[1].x - rect[0].x > maxSize) { // Split vertically.
            const prevX = rect[1].x;
            rect[1].x = rect[0].x + (rect[1].x - rect[0].x) / 2;
            rect[2].x = rect[1].x;
            polys.push([
                { x: rect[1].x, y: rect[0].y },
                { x: prevX, y: rect[1].y },
                { x: prevX, y: rect[2].y },
                { x: rect[1].x, y: rect[3].y }
            ]);
        }
    }
}
