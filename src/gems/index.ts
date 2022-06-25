import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, Object3D, PointLight, RingGeometry, Scene, TorusGeometry, Vector2, Vector3 } from "three";

import { withinDistance2D, everyNthFrame } from "../utils"

import { flash } from "../renderer/flashShader";

export default class GemsManager {

    private scene: Scene;
    private gems: Array<Function> = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    getGems() {
        return this.gems;
    }

    placeGem(x: number, z: number) {

        const g = new Group();

        let rand = Math.random();
        let rarity = 0;

        if (rand > .75) {
            rarity = 1;
        }

        if (rand > .95) {
            rarity = 2;
        }

        const rarityDetails = [
            { color: new Color(0, 0, 0) },
            { color: new Color(0, 0, 1) },
            { color: new Color(0.5, 0, 0.7) },
        ];

        const gem = new Mesh(new TorusGeometry(3, 0.5, 16, 100), new MeshBasicMaterial({ color: rarityDetails[rarity].color }))
        g.add(gem);

        g.position.x = x;
        g.position.z = z;
        g.position.y = 5;

        g.rotation.x = -1.5;

        this.scene.add(g);

        return everyNthFrame<boolean>((dt: number, felixPos: Vector2) => {

            const felixPickingUp = withinDistance2D(
                15,
                felixPos.x, g.position.x,
                felixPos.y, g.position.z
            );

            if (felixPickingUp) {
                flash(rarityDetails[rarity].color.toArray(), 0.02, 0.0001);
                this.scene.remove(g);
                return true;
            }

            const r = MathUtils.randFloat(0.1, Math.PI);
            g.rotation.y += r;
            g.rotation.x += r / MathUtils.randInt(1, 10);

            return false;

        }, 5);

    }

}