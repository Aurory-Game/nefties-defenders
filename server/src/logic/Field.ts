import { NavMesh, Point, PolyPoints, buildPolysFromGridMap } from 'navmesh';
import { FIELD_MAP_DATA, TileType } from '../../../shared/constants';

export default class Field {

    private landNav:NavMesh;
    private flyNav:NavMesh;

    constructor() {
        // TODO regenerate on buildings add/remove.
        const shrinkAmount = 0.25;
        const landPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, tt => tt != TileType.WATER, shrinkAmount);
        splitPolys(landPolys);
        this.landNav = new NavMesh(landPolys, shrinkAmount);
        const flyPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, () => true, shrinkAmount);
        splitPolys(flyPolys);

        this.landNav = new NavMesh(landPolys, shrinkAmount);
        this.flyNav = new NavMesh(flyPolys, shrinkAmount);
    }

    getPath(from:Point, to:Point, isFlying:boolean) {
        return (isFlying ? this.flyNav : this.landNav).findPath(from, to);
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
