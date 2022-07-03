import { Mesh, Vector2, MathUtils, Vector3 } from "three";
import SpritePlane from "../SpritePlane";
import Weapon from "../weapons";

const _v2 = new Vector2();

type EnemyConfig = {
    textureUrl: string,
    width: number,
    height: number,
    frameAmount: number,
    animationSpeed: number,
    health: number,
    speed?: number,
    hitboxPaddingX?: number;
    hitboxPaddingY?: number;
    increasedRarity?: number;
};

const _v3 = new Vector3();
const _up = new Vector3(0, 1, 0);

export default class TwoDEnemy {

    sprite: SpritePlane;
    object: Mesh;

    public health: number = 15;
    public stun: number = 0;
    public isDead: boolean = false;
    public increasedRarity: number;

    private width: number;
    private height: number;
    private speed: number;
    private hitboxPaddingX: number;
    private hitboxPaddingY: number;

    private hitCache: Map<Weapon, { time: number, untilNextAllowableHit: number }> = new Map();
    private reverseFlip: boolean = false;

    constructor({ textureUrl, width, height, frameAmount, animationSpeed, health, speed = 5, hitboxPaddingX = 0, hitboxPaddingY = 0, increasedRarity = 0 }: EnemyConfig) {
        this.sprite = new SpritePlane(textureUrl, width, height, 20, frameAmount, animationSpeed);
        this.health = health;
        this.object = this.sprite.mesh;

        this.width = width;
        this.height = height;
        this.speed = speed;
        this.hitboxPaddingX = hitboxPaddingX;
        this.hitboxPaddingY = hitboxPaddingY;

        this.increasedRarity = increasedRarity;

        _v3.set(0, 0, 1);
        _v3.applyAxisAngle(_up, MathUtils.randFloat(0, Math.PI * 2));
        _v3.multiplyScalar(275);

        this.object.position.x = _v3.x;
        this.object.position.z = _v3.z;
    }

    setReverseFlip() {
        this.reverseFlip = true;
    }

    moveTowards(pos: Vector2, dt: number, elapsed: number, upgradeScalar: number = 1) {

        if (this.stun > 0) {
            this.object.position.x += MathUtils.randFloat(-1, 1);
            this.object.position.z += MathUtils.randFloat(-1, 1);
            this.stun -= elapsed;
            this.sprite.setRed();
            return;
        } else if (this.stun !== 0) {
            this.sprite.setWhite();
            this.stun = 0;
        }

        _v2.set(
            pos.x - this.object.position.x,
            pos.y - this.object.position.z
        );
        _v2.normalize();

        _v2.divideScalar(this.speed);
        _v2.multiplyScalar(upgradeScalar);

        const movementTimeScale = elapsed / 16.667;

        _v2.multiplyScalar(movementTimeScale);

        this.object.position.x += _v2.x;
        this.object.position.z += _v2.y;

        if (this.reverseFlip) {
            this.sprite.update(dt, _v2.x > 0, true);
        } else {
            this.sprite.update(dt, _v2.x < 0, true);
        }

    }

    // This method needs to remember what weapons hit it and frame delay subsequent hits.
    // 2 frames = 2 hits right now.
    takeDamage(amount: number, weapon: Weapon, dt: number): boolean | null {

        const cachedHit = this.hitCache.get(weapon);
        if (cachedHit) {
            const { untilNextAllowableHit, time } = cachedHit;
            if (dt - time < untilNextAllowableHit) {
                return null; // No hit.
            }
        }

        this.hitCache.set(weapon, {
            time: dt,
            untilNextAllowableHit: weapon.hitDelay, // TBD by weapon properties.
        });

        this.health = this.health - amount;
        this.stun += weapon.stunValue;

        return this.health < 0; // should die, Director.
    }

    collidesWith(pos: Vector2) {

        const { x, z } = this.sprite.mesh.position;

        const inRangeH = Math.abs(x - pos.x) < (this.width + this.hitboxPaddingX) / 2;
        if (!inRangeH) return false;

        const inRangeV = Math.abs(z - pos.y) < (this.height + this.hitboxPaddingY) / 2;
        if (!inRangeV) return false;

        return true;

    }


}