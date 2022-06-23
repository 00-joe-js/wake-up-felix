import { Mesh, Object3D, Vector2, MathUtils, Vector3 } from "three";
import SpritePlane from "../TexturedPlane";

const _v2 = new Vector2();

export default class TwoDEnemy {

    sprite: SpritePlane;
    object: Mesh;

    private reverseFlip: boolean = false;

    constructor(textureUrl: string, width: number = 36, height: number = 36, frameAmount: number = 4, animationSpeed: number = 200) {
        this.sprite = new SpritePlane(textureUrl, width, height, 20, frameAmount, animationSpeed);
        this.object = this.sprite.mesh;
        this.object.position.x = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
        this.object.position.z = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
    }

    setReverseFlip(v: boolean = true) {
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

}