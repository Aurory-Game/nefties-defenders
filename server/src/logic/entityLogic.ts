import { TIMESTEP_S } from '../../../shared/constants';
import { EntityLogicData } from './ServerLogicEngine';

export function move(entity:EntityLogicData, speed:number):boolean {
    if (!entity.path) return true;
    const targetPoint = entity.path[entity.pathIndex];
    const dx = targetPoint.x - entity.sync.tileX;
    const dy = targetPoint.y - entity.sync.tileY;
    const length = Math.sqrt(dx * dx + dy * dy);

    entity.sync.tileX += (dx / length) * speed * TIMESTEP_S;
    entity.sync.tileY += (dy / length) * speed * TIMESTEP_S;

    if (length < speed * TIMESTEP_S) entity.pathIndex++;
    return entity.pathIndex >= entity.path.length;
}
