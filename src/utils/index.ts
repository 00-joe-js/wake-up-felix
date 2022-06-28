import { Object3D, Vector3 } from "three";

export const withinDistance2D = (distance: number, u1: number, u2: number, v1: number, v2: number) => {
    if (Math.abs(u1 - u2) > distance) return false;
    if (Math.abs(v1 - v2) > distance) return false;
    return true;
};

export function everyNthFrame<T>(frameFn: Function, nth: number): () => T | null {
    let c = 0;
    return (...args) => {
        if (c === 0) {
            c++;
            return frameFn(...args);
        } else {
            c++;
            if (c === nth) {
                c = 0;
            }
        }
    };
};

export const rotateAboutPoint = (
    obj: Object3D,
    point: Vector3,
    axis: Vector3,
    theta: number,
    pointIsWorld: boolean = false
) => {

    if (pointIsWorld) {
        obj.parent?.localToWorld(obj.position);
    }

    obj.position.sub(point);
    obj.position.applyAxisAngle(axis, theta);
    obj.position.add(point);

    if (pointIsWorld) {
        obj.parent?.worldToLocal(obj.position);
    }

    obj.rotateOnAxis(axis, theta);

};
