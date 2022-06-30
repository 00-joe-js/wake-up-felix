import { Group, Mesh, Object3D, Vector2, MathUtils, Scene, Vector3, RedIntegerFormat, BufferGeometry, MeshPhongMaterial, MeshStandardMaterial, Color } from "three";
import Weapon from "../weapons";

const _v2 = new Vector2();
const _right = new Vector2(1, 0);

export default class ClockNumEnemy {

    object: Mesh<BufferGeometry, MeshStandardMaterial>;

    public health: number = 20;
    public stun: number = 0;

    private hitCache: Map<Weapon, { time: number, untilNextAllowableHit: number }> = new Map();

    constructor(mesh: Mesh<BufferGeometry, MeshStandardMaterial>) {
        this.object = mesh;
    }

    moveTowards(felixPos: Vector2, dt: number, elapsed: number) {

        if (this.stun > 0) {
            this.object.position.x += MathUtils.randFloat(-1, 1);
            this.object.position.z += MathUtils.randFloat(-1, 1);
            this.stun -= elapsed;
            this.object.material.color = new Color(1, 0, 0);
            return;
        } else if (this.stun !== 0) {
            this.object.material.color = new Color(0, 0, 0);
            this.stun = 0;
        }

        const r = elapsed / 16.667;

        if (this.object.position.y < 30) {
            this.object.position.y += r / 4;
        }

        _v2.set(
            felixPos.x - this.object.position.x,
            felixPos.y - this.object.position.z
        );
        _v2.normalize();

        const angleBetween = Math.acos(
            _v2.dot(_right)
        );

        _v2.divideScalar(4.5);
        _v2.multiplyScalar(r);

        this.object.rotation.y = _v2.y > 0 ? -angleBetween : angleBetween;

        if (this.object.position.y > 15) {
            this.object.position.x += _v2.x;
            this.object.position.z += _v2.y;
            this.object.rotation.x += r / 10;
        }

    }

    takeDamage(amount: number, weapon: Weapon, dt: number): boolean | null {

        const cachedHit = this.hitCache.get(weapon);
        if (cachedHit) {
            const { untilNextAllowableHit, time } = cachedHit;
            if (dt - time < untilNextAllowableHit) {
                return null;
            }
        }

        this.hitCache.set(weapon, {
            time: dt,
            untilNextAllowableHit: weapon.hitDelay,
        });

        this.health = this.health - amount;
        this.stun += weapon.stunValue;

        return this.health < 0;
    }

    collidesWith(pos: Vector2, padding: number = 0) {

        const { x, z } = this.object.position;

        const inRangeH = Math.abs(x - padding - pos.x) < 30 / 2;
        if (!inRangeH) return false;

        const inRangeV = Math.abs(z - padding - pos.y) < 30 / 2;
        if (!inRangeV) return false;

        return true;

    }

}