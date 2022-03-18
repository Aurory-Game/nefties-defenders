import { TIMESTEP_S } from '../../../shared/constants';
import { EntityLogicData } from './ServerLogicEngine';
import * as SAT from 'sat';
import { EntityState } from '../../../shared/entities';
import Field from './Field';

const response = new SAT.Response();
const tempVec = new SAT.Vector();

export default class EntityManager {

    entities:EntityLogicData[] = [];

    constructor(public field:Field) { }

    // addEntity()

    update(tick:number) {
        this.ai(tick);
        collideEntities(this.entities);
        for (const entity of this.entities) { // Sync positions.
            entity.sync.tileX = entity.geom.pos.x;
            entity.sync.tileY = entity.geom.pos.y;
        }
    }

    ai(curTick:number) {
        for (const entity of this.entities) {
            // TODO validate target.
            if (curTick >= entity.nextStateAt) { // Switch state if needed.
                switch (entity.sync.state) {
                case EntityState.ATTACKING:
                    // TODO handle attacking.
                    break;
                case EntityState.SPAWNING:
                    // TODO proper AI, pick target, check distances, etc.
                    if (entity.data.walkSpeed == 0) {
                        entity.sync.state = EntityState.STANDING;
                    } else {
                        entity.sync.state = EntityState.MOVING;
                        // Let's just go to the center of opposite side for now.
                        const targetPos = { x: 9, y: entity.owner.sync.secret.isFlipped ? 32 - 6 : 6 };
                        entity.path = this.field.getPath(entity.geom.pos, targetPos, entity.data.isFlying);
                        entity.pathIndex = 1; // We are already at point 0.
                    }
                    break;
                }
            }
            if (entity.sync.state == EntityState.MOVING) {
                if (moveEntity(entity, entity.data.walkSpeed)) {
                    entity.sync.state = EntityState.ATTACKING;
                    // TODO targeting system.
                }
            }

            if (entity.geom instanceof SAT.Circle) {
                this.field.collideWalls(entity.geom, entity.data.isFlying);
            }

        }
    }

}

function moveEntity(entity:EntityLogicData, speed:number):boolean {
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

function collideEntities(entities:EntityLogicData[]) {
    for (let i = 0; i < entities.length; i++) {
        const e1 = entities[i];
        if (e1.geom instanceof SAT.Circle) {
            for (let ii = i + 1; ii < entities.length; ii++) {
                const e2 = entities[ii];
                if (e2.geom instanceof SAT.Circle && e1.data.isFlying == e2.data.isFlying) {
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
