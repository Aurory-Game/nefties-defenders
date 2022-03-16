import { TIMESTEP_S } from '../../../shared/constants';
import { EntityLogicData } from './ServerLogicEngine';
import * as SAT from 'sat';

const response = new SAT.Response();
const tempVec = new SAT.Vector();

export function moveEntity(entity:EntityLogicData, speed:number):boolean {
    if (!entity.path) return true;
    const { pos } = entity.geom;
    const targetPoint = entity.path[entity.pathIndex];
    const dx = targetPoint.x - pos.x;
    const dy = targetPoint.y - pos.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    pos.x += (dx / length) * speed * TIMESTEP_S;
    pos.y += (dy / length) * speed * TIMESTEP_S;

    if (length < 0.2) entity.pathIndex++;
    return entity.pathIndex >= entity.path.length;
}

export function collideEntities(entities:EntityLogicData[]) {
    for (let i = 0; i < entities.length; i++) {
        const e1 = entities[i];
        if (e1.geom instanceof SAT.Circle) {
            for (let ii = i + 1; ii < entities.length; ii++) {
                const e2 = entities[ii];
                if (e2.geom instanceof SAT.Circle) {
                    response.clear();
                    if (SAT.testCircleCircle(e1.geom, e2.geom, response)) {
                        // Push each other out, based on their sizes.
                        const sumR = e1.geom.r + e2.geom.r;
                        // Coefficients.
                        const c1 = e1.geom.r / sumR;
                        const c2 = e2.geom.r / sumR;
                        // Push-out distances.
                        // Don't push away more than half of speed, so pass-through is possible, otherwise
                        // two big entities could get stuck on the bridge (if they don't target each other).
                        const d1 = Math.min(c1 * response.overlap, (e1.data.walkSpeed / 2) * TIMESTEP_S);
                        const d2 = Math.min(c2 * response.overlap, (e2.data.walkSpeed / 2) * TIMESTEP_S);
                        e1.geom.pos.add(tempVec.copy(response.overlapN).reverse().scale(d1));
                        e2.geom.pos.add(tempVec.copy(response.overlapN).scale(d2));
                    }
                }
            }
        }
    }
}
