import { PerspectiveCamera, OrthographicCamera, Object3D, Vector3, Mesh, PointLight, Scene, Vector2, Box3 } from "three";

import SpritePlane from "../SpritePlane";

import { flash } from "../renderer/flashShader";
import { shake } from "../renderer";

class FelixCamera {

    public sprite: SpritePlane;
    public camera: PerspectiveCamera;

    public health: number = 5000;

    private aura: Object3D;
    private lastDamageTakenTime: number = -1;

    constructor(felix: SpritePlane, scene: Scene) {

        this.sprite = felix;
        this.sprite.mesh.position.y = 10;

        this.sprite.mesh.position.x = 0;
        this.sprite.mesh.position.z = 0;

        setTimeout(() => {
            location.reload();
        }, 60 * 1000 * 5);

        this.camera = new PerspectiveCamera(80, 16 / 9);
        this.camera.position.y = 10;

        this.aura = new PointLight(0xaaaaaa, 10, 50);
        scene.add(this.aura);
    }

    public getPosition() {
        return new Vector2(this.sprite.mesh.position.x, this.sprite.mesh.position.z);
    }

    public getBox(): Box3 {
        const b = this.sprite.mesh.geometry.boundingBox;
        if (!b) throw new Error("Felix has no bounding box. Why?");
        return b;
    }

    public runUpdate(dt: number) {
        this.aura.position.copy(this.sprite.mesh.position);
        this.aura.position.y = 45;
        this.camera.position.set(this.sprite.mesh.position.x, this.camera.position.y, this.sprite.mesh.position.z);

        const spriteY = this.sprite.mesh.position.z; // lol yep pretty much

        this.camera.rotation.x = -Math.PI / 2;

        this.camera.rotation.x += (Math.PI / 12) + (Math.PI / 12) * (spriteY / 225);

        this.camera.fov = 80 + (Math.max(0, spriteY) * 0.01);
        this.camera.updateProjectionMatrix();

        if (this.camera.position.y < 150) {
            this.camera.position.y += 1;
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