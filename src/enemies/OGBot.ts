import { Group, Mesh, Object3D, Vector2, MathUtils } from "three";

const _v2 = new Vector2();
const _right = new Vector2(1, 0);

export default class OGBot {
    object: Object3D;

    static MODEL_GROUP: Group | null = null;

    constructor() {
        if (OGBot.MODEL_GROUP === null) throw new Error("Model not provided for OGBot");
        this.object = OGBot.MODEL_GROUP.clone();
        this.object.position.x = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
        this.object.position.z = Math.random() > 0.5 ? MathUtils.randInt(-200, -100) : MathUtils.randInt(100, 200);
    }
    moveTowards(felix: Object3D, dt: number) {

        _v2.set(
            felix.position.x - this.object.position.x,
            felix.position.z - this.object.position.z
        );
        _v2.normalize()

        const angleBetween = Math.acos(
            _v2.dot(_right)
        );

        _v2.divideScalar(4.5);
        this.object.position.x += _v2.x;
        this.object.position.z += _v2.y;
        this.object.rotation.y = _v2.y > 0 ? -angleBetween : angleBetween;

    }
}