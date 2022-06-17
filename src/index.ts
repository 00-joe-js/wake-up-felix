import "./style.css";

import { Scene, AmbientLight, DirectionalLight, MeshPhongMaterial, Color, MathUtils, Vector3, Group, PlaneGeometry, TextureLoader, Material, Vector2, RepeatWrapping } from "three";
import { Mesh } from "three";


/* GLOBALS */
declare global {
    var PI: number;
    var PI2: number;
    var ZERO_VEC3: Vector3;
    var RED: Color;
    var BLUE: Color;
    var HYPER_BLUE: Color;
    var getDOMOne: (s: string) => HTMLElement
}
window.PI = Math.PI;
window.PI2 = Math.PI * 2;
window.ZERO_VEC3 = new Vector3(0, 0, 0);
window.RED = new Color(0xff0000);
window.BLUE = new Color(0x0000ff);
window.HYPER_BLUE = new Color(0xaaffff);
const getDOMOne = (selector: string): HTMLElement => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Couldn't find ${selector}. :/`);
    return element;
};
window.getDOMOne = getDOMOne;

// ---

import { withinDistance2D } from "./utils";
import loadModels from "./importHelpers/gltfLoader";

import { KeyboardInterface } from "./firstPersonCharacter/inputHelper";

import Gems from "./gems";
import { OGBullet as Bullet } from "./weapons/OGBullet";
import SpritePlane from "./TexturedPlane";

import felixWalkSheetUrl from "../assets/felix-walk.png";

import OGBot from "./enemies/OGBot";

import { renderLoop, shake } from "./renderer";
import FelixCamera from "./felixCamera";
import DamageNumbers from "./damageNumbers";

import Director from "./Director";

const scene = new Scene();

// randos.

let sceneMade = false;
let loopHooks: Array<(dt: number) => void> = [];

const createStageMaterial = () => {
    const bumpMap = new TextureLoader().load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/33170/egyptian_friz_2.png");
    const specularMap = new TextureLoader().load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/33170/specular_map.jpg");
    bumpMap.wrapS = RepeatWrapping;
    bumpMap.wrapT = RepeatWrapping;
    specularMap.wrapS = RepeatWrapping;
    specularMap.wrapT = RepeatWrapping;

    const r = 50;
    bumpMap.repeat.set(r, r);
    specularMap.repeat.set(r, r);
    const mat = new MeshPhongMaterial({
        color: new Color(0.1, 0.1, 0.1),
        emissive: new Color(0.05, 0.05, 0.02),
        specular: new Color(0.7, 0.7, 0.02),
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 0.03,
        map: specularMap
    });
    return mat;
};

(async () => {

    const models = await loadModels();
    const masterCylinderGroup = models[0].scene;
    masterCylinderGroup.scale.set(5, 5, 5);

    const keyboard = new KeyboardInterface();
    const FELIX_SIZE = 16;
    const itsMeFelix = new SpritePlane(
        felixWalkSheetUrl,
        FELIX_SIZE * 0.875647668, FELIX_SIZE,
        5,
        6
    );

    const fCam = new FelixCamera(itsMeFelix.mesh, scene);

    renderLoop(scene, fCam.camera, (dt) => {

        if (sceneMade === false) {

            sceneMade = true;

            const dirLight = new DirectionalLight(0xcc99ff, 0.01);
            dirLight.position.set(-5, 10, 0);
            scene.add(dirLight);

            const STAGE_HEIGHT = 4000;
            const groundG = new PlaneGeometry(STAGE_HEIGHT * 10, STAGE_HEIGHT, 32, 8);
            let groundMat: Material = createStageMaterial();
            const ground = new Mesh(groundG, groundMat);
            ground.rotateX(-Math.PI / 2);
            ground.name = "ground";

            ground.rotation.z = Math.PI;

            scene.add(ground);
            scene.add(itsMeFelix.mesh);

            let felixWalking = false;
            let felixFlipped = false;
            const FELIX_SPEED = 0.5;
            loopHooks.push((dt) => {
                let xDelta = 0;
                let zDelta = 0;
                if (keyboard.dDown) {
                    xDelta += FELIX_SPEED;
                }
                if (keyboard.aDown) {
                    xDelta -= FELIX_SPEED;
                }
                if (keyboard.wDown) {
                    zDelta -= FELIX_SPEED;
                }
                if (keyboard.sDown) {
                    zDelta += FELIX_SPEED;
                }
                if (xDelta !== 0 || zDelta !== 0) {

                    felixWalking = true;
                    itsMeFelix.mesh.position.x += xDelta;
                    itsMeFelix.mesh.position.z += zDelta;

                    if (xDelta !== 0) {
                        felixFlipped = xDelta < 0;
                    }

                } else {
                    felixWalking = false;
                }

            });

            loopHooks.push((dt) => {
                fCam.runUpdate();
                itsMeFelix.update(dt, felixFlipped, felixWalking);
            });

            const bullet = new Bullet();
            scene.add(bullet.mesh);

            OGBot.MODEL_GROUP = masterCylinderGroup;
            const theDirector = new Director(dt, scene, fCam);

            theDirector.addWeapon(bullet);

            loopHooks.push((dt) => {
                theDirector.update(dt);
            });

        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


