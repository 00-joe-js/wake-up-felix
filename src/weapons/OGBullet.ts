import bulletUrl from "../../assets/bullet.png";

import { Mesh, Object3D } from "three";

import { shake } from "../renderer";
import SpritePlane from "../SpritePlane";
import { withinDistance2D } from "../utils";

export default class Weapon {
    update(dt: number, felix: Object3D) {
        throw new Error("Not implemented");
    }
    detectCollision(x: number, y: number): boolean {
        throw new Error("Not implemented");
    }
    onEnemyCollide() {
        throw new Error("Not implemented");
    }
}

export class OGBullet extends Weapon {

    static COLLIDE_DISTANCE: number = 18;

    sprite: SpritePlane;
    mesh: Mesh;

    constructor() {
        super();
        const BULLET_SIZE = 30;
        const BULLET_RATIO = 101 / (664 / 3);
        this.sprite = new SpritePlane(bulletUrl, BULLET_SIZE, BULLET_SIZE * BULLET_RATIO, 5, 3);
        this.mesh = this.sprite.mesh;
    }

    update(dt: number, felix: Object3D) {
        const r = Math.sin(dt / 1000);
        const c = Math.cos(dt / 1000);
        this.mesh.position.x = felix.position.x + (r * 100);
        this.mesh.position.z = felix.position.z + (Math.sin(dt / 700) * 50);
        this.sprite.update(dt, c < 0, true);
    }

    detectCollision(x: number, y: number): boolean {
        return withinDistance2D(OGBullet.COLLIDE_DISTANCE, this.mesh.position.x, x, this.mesh.position.z, y);
    }

    onEnemyCollide(): void {
        shake(200);
    }
}