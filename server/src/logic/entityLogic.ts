import { TIMESTEP_S } from '../../../shared/constants';
import { EntityLogicData } from './ServerLogicEngine';

export function moveEntity(entity:EntityLogicData, speed:number):boolean {
    if (!entity.path) return true;
    const { pos } = entity.geom;
    const targetPoint = entity.path[entity.pathIndex];
    const dx = targetPoint.x - pos.x;
    const dy = targetPoint.y - pos.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    pos.x += (dx / length) * speed * TIMESTEP_S;
    pos.y += (dy / length) * speed * TIMESTEP_S;

    if (length < speed * TIMESTEP_S) entity.pathIndex++;
    return entity.pathIndex >= entity.path.length;
}
