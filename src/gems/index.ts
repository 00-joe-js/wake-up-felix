import { Color, Group, Mesh, MeshBasicMaterial, Object3D, PointLight, RingGeometry, Scene, TorusGeometry, Vector3 } from "three";

import { withinDistance2D } from "../utils"

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
            { color: new Color(1, 1, 0) },
            { color: new Color(0, 0, 1) },
            { color: new Color(1, 0, 0) },
        ];

        const gem = new Mesh(new TorusGeometry(2, .5, 16, 100), new MeshBasicMaterial({ color: rarityDetails[rarity].color }))
        g.add(gem);

        g.position.x = x;
        g.position.z = z;
        g.position.y = 5;

        this.scene.add(g);

        return (dt: number, felix: Object3D) => {

            const felixPos = felix.position;

            const felixPickingUp = withinDistance2D(
                10,
                felixPos.x, g.position.x,
                felixPos.z, g.position.z
            );

            if (felixPickingUp) {
                flash(rarityDetails[rarity].color.toArray(), 0.02, 0.0001);
                this.scene.remove(g);
                return true;
            }

            g.rotation.y += 0.002;

            return false;

        };

    }

}