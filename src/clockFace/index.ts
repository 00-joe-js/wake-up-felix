import { BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, Vector3 } from "three";
import { everyNthFrame } from "../utils";

const rotateAboutPoint = (obj: Object3D, point: Vector3, axis: Vector3, theta: number, pointIsWorld: boolean = false) => {

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

const _zero = new Vector3(0, 0, 0);
const _up = new Vector3(0, 1, 0);

export default class Clockface {

    public secondsHand: Mesh;
    public minuteHand: Mesh;
    public mSecondsHand: Mesh;

    public timeElapsed: number = 0;

    private startTime: number;
    private lastTime: number;

    constructor(dt: number) {

        this.minuteHand = new Mesh(new BoxGeometry(260, 5, 5), new MeshPhongMaterial({ color: 0x000000 }))
        this.secondsHand = new Mesh(new BoxGeometry(280, 5, 5), new MeshPhongMaterial({ color: 0x770000, shininess: 100 }));
        this.mSecondsHand = new Mesh(new BoxGeometry(300, 3, 0.2), new MeshBasicMaterial({ color: 0x770033 }))

        this.minuteHand.rotation.y = -Math.PI / 2;
        this.minuteHand.position.z = -260 / 2;
        this.minuteHand.position.y = 1;

        this.secondsHand.rotation.y = -Math.PI / 2;
        this.secondsHand.position.z = -280 / 2;

        this.mSecondsHand.rotation.y = -Math.PI / 2;
        this.mSecondsHand.position.z = -300 / 2;

        this.startTime = dt;
        this.lastTime = dt;

        this.update = everyNthFrame(this.update.bind(this), 3);

    }

    update(dt: number) {
        const elapsed = dt - this.lastTime;
        this.lastTime = dt;

        const secondsD = (-Math.PI * 2) / (60 * 60);
        const minuteD = (-Math.PI * 2) / (60 * 60 * 12);
        const msD = (-Math.PI * 2) / 60 / 4;

        const t = elapsed / 16.667;

        this.timeElapsed += elapsed;

        const minuteTheta = minuteD * t;
        const secondsTheta = secondsD * t;
        const msTheta = msD * t;

        rotateAboutPoint(this.secondsHand, _zero, _up, secondsTheta, true);
        rotateAboutPoint(this.minuteHand, _zero, _up, minuteTheta, true);
        rotateAboutPoint(this.mSecondsHand, _zero, _up, msTheta, true);
    }

}