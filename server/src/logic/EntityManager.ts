import { FIELD_TILES_HEIGHT, FIELD_TILES_HEIGHT_MID, FIELD_TILES_WIDTH_MID, LEFT_LANE, RIGHT_LANE,
    TICKS_1S, TIMESTEP_S } from '../../../shared/constants';
import { EntityLogicData } from './ServerLogicEngine';
import * as SAT from 'sat';
import { EntityState, EntityType, VIEW_RANGE, canTarget } from '../../../shared/entities';
import Field from './Field';
import { Point } from 'navmesh';

export default class EntityManager {

    entities:EntityLogicData[] = [];

    constructor(public field:Field) { }

    update(tick:number) {
        this.ai(tick);
        collideEntities(this.entities);
        for (const entity of this.entities) if (entity.geom instanceof SAT.Circle) {
            this.field.collideWalls(entity.geom, entity.data.isFlying);
        }
        for (const entity of this.entities) { // Sync positions.
            entity.sync.tileX = entity.geom.pos.x;
            entity.sync.tileY = entity.geom.pos.y;
        }
    }

    gameOver() {
        for (const entity of this.entities) {
            entity.sync.state = EntityState.IDLE;
        }
    }

    private ai(curTick:number) {
        // Update all entities' actions.
        for (const entity of this.entities) {
            if (curTick == entity.nextStateAt) { // Activity ends this tick.
                switch (entity.sync.state) {
                case EntityState.ATTACKING:
                    if (entity.target) {
                        entity.target.sync.hp -= entity.data.damage;
                        // TODO projectile events.
                    }
                    break;
                }
            }
            if (curTick >= entity.nextStateAt) { // Is not locked in an activity.
                this.checkNextAction(entity, curTick);
            }
        }

        // Now move them all.
        for (const entity of this.entities) {
            if (entity.sync.state == EntityState.MOVING) {
                moveEntity(entity, entity.data.walkSpeed);
            }
        }
    }

    private checkNextAction(entity:EntityLogicData, curTick:number) {
        if (entity.target && entity.target.sync.hp <= 0) { // Validate target.
            entity.target = null;
        }
        if (!entity.target) this.setTarget(entity); // Set if needed.
        if (entity.target) {
            if (inAttackRange(entity, entity.target)) {
                triggerAttack(entity, curTick);
            } else {
                if (entity.data.walkSpeed == 0)
                    throw 'Assertion failed: Buildings should not have target out of range.';
                entity.sync.state = EntityState.MOVING;
                this.setPathTowards(entity, entity.target);
            }
        } else { // No target.
            if (entity.data.walkSpeed == 0) { // Buildings just stand there.
                entity.sync.state = EntityState.STANDING;
            } else { // Entities walk to the other side.
                this.walkToOpponentSide(entity);
            }
        }
    }

    setPathTowards(entity:EntityLogicData, target:EntityLogicData) {
        if (target.geom instanceof SAT.Polygon) {
            // Buildings are cut out of navmesh, need to find point in front of them,
            // as the 'navmesh' library doesn't handle that.
            const targetPos = findBuildingPoint(entity.geom.pos, target.geom, 0.5);
            this.setPath(entity, targetPos);
        } else { // For normal entities we can just walk towards their center.
            this.setPath(entity, target.geom.pos);
        }
    }

    private setTarget(entity:EntityLogicData) {
        // TODO don't target entities that are going to die.
        let range = entity.data.range;
        if (entity.data.walkSpeed > 0 && range < VIEW_RANGE) // If not a building, target up to view range.
            range = VIEW_RANGE;
        const rangeSq = range ** 2;
        entity.target = null;
        let closestDist = Number.POSITIVE_INFINITY;
        for (const other of this.entities) {
            if (other.owner == entity.owner
                || other.sync.state == EntityState.SPAWNING
                || !canTarget(entity.sync.type, other.sync.type)
                || other.sync.hp <= 0) continue;
            const distSq = tempVec.copy(other.geom.pos).sub(entity.geom.pos).len2();
            if (distSq <= rangeSq && distSq < closestDist) {
                entity.target = other;
                closestDist = distSq;
            }
        }
    }

    private walkToOpponentSide(entity:EntityLogicData) {
        entity.sync.state = EntityState.MOVING;
        const { isFlipped } = entity.owner.sync.secret;
        const { pos } = entity.geom;

        // Walk to the correct lane.
        tempVec.x = pos.x < FIELD_TILES_WIDTH_MID ? LEFT_LANE : RIGHT_LANE;
        // Walk to the bridge first if needed. Makes sure the pathfinding won't try to go around the other side.
        const bridgeFirst = !entity.data.isFlying
            && (isFlipped ? pos.y < FIELD_TILES_HEIGHT_MID : pos.y > FIELD_TILES_HEIGHT_MID);
        if (bridgeFirst) { // Walk towards the bridge.
            tempVec.y = FIELD_TILES_HEIGHT_MID + (isFlipped ? 1 : -1);
        } else { // Walk to the opponent.
            let hasSmallTower = false;
            for (const e of this.entities)
                if (e.sync.type == EntityType.SmallTower && e.owner != entity.owner
                    && (e.geom.pos.x < FIELD_TILES_WIDTH_MID == pos.x < FIELD_TILES_WIDTH_MID)) {
                    hasSmallTower = true;
                    break;
                }
            const yPos = hasSmallTower ? 7 : 3;
            tempVec.y = isFlipped ? FIELD_TILES_HEIGHT - yPos : yPos;
            if (!hasSmallTower && (isFlipped ? pos.y > FIELD_TILES_HEIGHT - 4 : pos.y < 4)) {
                // Walk towards big tower.
                tempVec.x = pos.x < FIELD_TILES_WIDTH_MID ? LEFT_LANE + 3.5 : RIGHT_LANE - 3.5;
            }
        }
        this.setPath(entity, tempVec);
    }

    private setPath(entity:EntityLogicData, target:Point) {
        entity.path = this.field.getPath(entity.geom.pos, target, entity.data.isFlying);
        entity.pathIndex = 1; // We are already at point 0.
    }

}

const response = new SAT.Response();
const tempVec = new SAT.Vector();
const tempPos = new SAT.Vector();
const tempLine = new SAT.Polygon(new SAT.Vector(), [new SAT.Vector(), new SAT.Vector(1)]);

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
                        // If the entities are on the same x axis, rotate pushout vector slightly towards center.
                        // Makes the entities spread out instead of constantly push through each other.
                        if (Math.abs(response.overlapN.x) < 0.001) {
                            let angle = e1.geom.pos.x < FIELD_TILES_WIDTH_MID ? 0.1 : -0.1;
                            if (response.overlapN.y < 0) angle *= -1;
                            response.overlapN.rotate(angle);
                        }
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

/** Does not check if the target is valid. */
function inAttackRange(entity:EntityLogicData, target:EntityLogicData) {
    let targetPos = target.geom.pos;
    if (target.geom instanceof SAT.Polygon) { // Attack at edge of building.
        targetPos = findBuildingPoint(entity.geom.pos, target.geom);
    }
    return tempVec.copy(entity.geom.pos).sub(targetPos).len2() <= (entity.data.range ** 2);
}

function triggerAttack(entity:EntityLogicData, curTick:number) {
    entity.sync.state = EntityState.ATTACKING;
    entity.nextStateAt = curTick + Math.ceil(entity.data.hitSpeed * TICKS_1S);
}

function findBuildingPoint(from:SAT.Vector, building:SAT.Polygon, offset:number = 0) {
    tempPos.copy(building.pos).sub(from);
    const len = tempPos.len() - 0.5;
    tempPos.normalize().scale(len);
    tempLine.points[1].copy(tempPos);
    tempLine.pos.copy(from);
    tempLine.setPoints(tempLine.points);
    // Cast a ray from `entity` to `target`, but half a tile shorter, so we get correct edge.
    response.clear();
    SAT.testPolygonPolygon(building, tempLine, response);
    response.overlapN.scale(response.overlap + offset);
    return tempPos.copy(building.pos).add(response.overlapN);
}
