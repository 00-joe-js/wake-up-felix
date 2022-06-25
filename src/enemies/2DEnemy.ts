import { Mesh, Object3D, Vector2, MathUtils, Vector3 } from "three";
import SpritePlane from "../SpritePlane";
import Weapon from "../weapons/OGBullet";

const _v2 = new Vector2();

type EnemyConfig = {
    textureUrl: string,
    width: number,
    height: number,
    frameAmount: number,
    animationSpeed: number,
    health: number,
};

export default class TwoDEnemy {

    sprite: SpritePlane;
    object: Mesh;

    private hitCache: Map<Weapon, { time: number, untilNextAllowableHit: number }> = new Map();
    private reverseFlip: boolean = false;
    private health: number = 15;

    constructor({ textureUrl, width, height, frameAmount, animationSpeed, health }: EnemyConfig) {
        this.sprite = new SpritePlane(textureUrl, width, height, 20, frameAmount, animationSpeed);
        this.health = health;
        this.object = this.sprite.mesh;
        // TODO: make this based on clock dimensions.
        this.object.position.x = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
        this.object.position.z = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
    }

    setReverseFlip() {
        this.reverseFlip = true;
    }

    moveTowards(felix: Object3D, dt: number) {

        _v2.set(
            felix.position.x - this.object.position.x,
            felix.position.z - this.object.position.z
        );
        _v2.normalize();

        _v2.divideScalar(4.5);
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
            untilNextAllowableHit: 2000, // TBD by weapon properties.
        });

        this.health = this.health - amount;
        this.sprite.flashRed();

        return this.health < 0; // should die, Director.
    }


}