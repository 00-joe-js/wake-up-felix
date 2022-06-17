import { BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, Vector3 } from "three";

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

export default class Clockface {

    public secondsHand: Mesh;
    public minuteHand: Mesh;
    public mSecondsHand: Mesh;

    public timeElapsed: number = 0;

    private lastTime: number;

    constructor(dt: number) {

        this.minuteHand = new Mesh(new BoxGeometry(320, 5, 5), new MeshPhongMaterial({ color: 0x000000 }))
        this.secondsHand = new Mesh(new BoxGeometry(330, 5, 5), new MeshPhongMaterial({ color: 0x770000, shininess: 100 }));
        this.mSecondsHand = new Mesh(new BoxGeometry(340, 3, 0.2), new MeshBasicMaterial({ color: 0x770033 }))

        this.minuteHand.rotation.y = -Math.PI / 2;
        this.minuteHand.position.z = -320 / 2;
        this.minuteHand.position.y = 1;

        this.secondsHand.rotation.y = -Math.PI / 2;
        this.secondsHand.position.z = -330 / 2;

        this.mSecondsHand.rotation.y = -Math.PI / 2;
        this.mSecondsHand.position.z = -340 / 2;

        this.lastTime = dt;

        setInterval(() => {
            // this.secondsHand.position.z = 0;
            // this.secondsHand.rotation.y += -0.1;
            // this.secondsHand.position.z = -350 / 2;
        }, 200);
    }

    update(dt: number) {
        const elapsed = dt - this.lastTime;
        this.lastTime = dt;

        const secondsD = (-Math.PI * 2) / (60 * 60);
        const minuteD = (-Math.PI * 2) / (60 * 60 * 12);
        const msD = (-Math.PI * 2) / 60;

        const t = elapsed / 16.667;

        this.timeElapsed += elapsed;
        // console.log(this.timeElapsed);

        const minuteTheta = minuteD * t;
        const secondsTheta = secondsD * t;
        const msTheta = msD * t;

        rotateAboutPoint(this.secondsHand, new Vector3(0, 0, 0), new Vector3(0, 1, 0), secondsTheta, true);
        rotateAboutPoint(this.minuteHand, new Vector3(0, 0, 0), new Vector3(0, 1, 0), minuteTheta, true);
        rotateAboutPoint(this.mSecondsHand, new Vector3(0, 0, 0), new Vector3(0, 1, 0), msTheta, true);
    }

}