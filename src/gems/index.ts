import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, Object3D, PointLight, RingGeometry, Scene, TorusGeometry, Vector2, Vector3 } from "three";

import { withinDistance2D, everyNthFrame } from "../utils"

import { flash } from "../renderer/flashShader";
import { UIMethods } from "../gameUI";
import FelixCamera from "../felixCamera";

export default class GemsManager {

    private scene: Scene;
    private ui: UIMethods;

    constructor(scene: Scene, ui: UIMethods) {
        this.scene = scene;
        this.ui = ui;
    }

    createGemMesh(color: Color): Mesh<TorusGeometry, MeshBasicMaterial> {
        return new Mesh(
            new TorusGeometry(3, 0.5, 16, 100),
            new MeshBasicMaterial({ color })
        );
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
            { color: new Color(0, 0, 0), amount: 1 },
            { color: new Color(0, 0, 1), amount: 5 },
            { color: new Color(0.5, 0, 0.7), amount: 10 },
        ];

        const gem = this.createGemMesh(rarityDetails[rarity].color);
        g.add(gem);

        g.position.x = x;
        g.position.z = z;
        g.position.y = 5;

        g.rotation.x = -1.5;

        this.scene.add(g);

        return everyNthFrame<boolean>((dt: number, felixPos: Vector2) => {

            const felixPickingUp = withinDistance2D(
                20,
                felixPos.x, g.position.x,
                felixPos.y, g.position.z
            );

            if (felixPickingUp) {
                const rarityDeets = rarityDetails[rarity];
                flash(rarityDeets.color.toArray(), 0.02, 0.0001);
                this.scene.remove(g);
                this.ui.addXP(rarityDeets.amount);
                return true;
            }

            const r = MathUtils.randFloat(0.1, Math.PI);
            g.rotation.y += r;
            g.rotation.x += r / MathUtils.randInt(1, 10);

            return false;

        }, 10);

    }

    playBaggingEffect(scene: Scene, gemTotal: number, felix: FelixCamera, numberPos: Vector3) {

        const newMeshes = new Array(Math.min(gemTotal, 100)).fill(null).map(() => this.createGemMesh(new Color(0, 0, 0)));

        const meshesWithDelay = newMeshes.map(m => ({ mesh: m, delay: MathUtils.randFloat(0, 1) }));

        const padding = 50;

        // todo: is it worth hooking this up to true delta time?
        meshesWithDelay.forEach(({ mesh, delay }) => {
            setTimeout(() => {
                const { x, y } = felix.getPosition();
                mesh.position.y = 20;
                mesh.position.x = x + MathUtils.randInt(-padding, padding);
                mesh.position.z = y + MathUtils.randInt(-padding, padding);
                const directionToDestination = new Vector3().subVectors(numberPos, mesh.position);
                directionToDestination.normalize().multiplyScalar(5);
                scene.add(mesh);
                const flying = setInterval(() => {
                    mesh.position.add(directionToDestination);
                }, 17);
                setTimeout(() => {
                    clearInterval(flying);
                }, 2000);
            }, delay * 1500);
        });

    }

}