import { PerspectiveCamera, OrthographicCamera, Object3D, Vector3, Mesh, PointLight, Scene } from "three";

import { flash } from "../renderer/flashShader";
import { shake } from "../renderer";

class FelixCamera {

    public object: Object3D;
    public camera: PerspectiveCamera;

    public health: number = 5000;

    private aura: Object3D;
    private lastDamageTakenTime: number = -1;

    constructor(felix: Object3D, scene: Scene) {
        
        this.object = felix;
        this.object.position.y = 10;

        this.object.position.x = 0;
        this.object.position.z = -200;
        
        this.camera = new PerspectiveCamera(80, 16 / 9);
        this.camera.rotateOnAxis(new Vector3(1, 0, 0), -Math.PI / 2 + 0.05);
        this.camera.position.y = 10;
        
        this.aura = new PointLight(0xaaaaaa, 10, 50);
        scene.add(this.aura);
    }

    public runUpdate() {
        this.aura.position.copy(this.object.position);
        this.aura.position.y = 45;
        this.camera.position.set(this.object.position.x, this.camera.position.y, this.object.position.z);
        if (this.camera.position.y < 120) {
            this.camera.position.y += 0.4;
        }
    }

    public takeDamage(dt: number) {
        if (dt - this.lastDamageTakenTime > 2000) {
            this.health = this.health - 1;
            this.lastDamageTakenTime = dt;
            flash([1, 0, 0], 0.2, 0.001);
            shake(400);
            if (this.health === 0) {
                window.location.reload();
            }
        }
    }

}

export default FelixCamera;