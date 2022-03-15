import { NavMesh, Point, PolyPoints, buildPolysFromGridMap } from 'navmesh';
import { FIELD_MAP_DATA, TileType } from '../../../shared/constants';

export default class Field {

    private landNav:NavMesh;
    private flyNav:NavMesh;

    constructor() {
        // TODO regenerate on buildings add/remove.
        const landPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, tt => tt != TileType.WATER, 0.4);
        splitPolys(landPolys);
        this.landNav = new NavMesh(landPolys, 0.4);
        const flyPolys = buildPolysFromGridMap(FIELD_MAP_DATA, 1, 1, () => true, 0.4);
        splitPolys(flyPolys);

        this.landNav = new NavMesh(landPolys, 0.4);
        this.flyNav = new NavMesh(flyPolys, 0.4);
    }

    getPath(from:Point, to:Point, isFlying:boolean) {
        return (isFlying ? this.flyNav : this.landNav).findPath(from, to);
    }

}

/**
 * Since 'navmesh' uses simple A* and uses number of polygons stepped as distance, not real distance,
 * the resulting path can be non-optimal. We improve on that by simply splitting big polygons into smaller ones.
 * Alternative would be modifying 'navmesh' to keep searching for more paths,
 * and calculate the real distance of them.
 */
function splitPolys(polys:PolyPoints[]):void {
    const maxSize = 4;
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
        while (rect[3].y - rect[0].y > maxSize) { // Split vertically.
            const prevY = rect[3].y;
            rect[2].y = rect[0].y + (rect[3].y - rect[0].y) / 2;
            rect[3].y = rect[2].y;
            polys.push([
                { x: rect[3].x, y: rect[3].y },
                { x: rect[2].x, y: rect[2].y },
                { x: rect[2].x, y: prevY },
                { x: rect[3].x, y: prevY }
            ]);
        }
    }
}
