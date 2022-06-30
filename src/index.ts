import "./style.css";

import { Scene, AmbientLight, MeshPhongMaterial, Color, Vector3, Material, CylinderGeometry, MeshBasicMaterial, SphereBufferGeometry, Sphere, SphereGeometry, Group, MathUtils } from "three";
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

import loadModels from "./importHelpers/gltfLoader";

import { KeyboardInterface } from "./firstPersonCharacter/inputHelper";

import { OGBullet as Bullet, One, Two, Three, Four, Five } from "./weapons";
import SpritePlane from "./SpritePlane";

import felixWalkSheetUrl from "../assets/felix-walk.png";

import OGBot from "./enemies/OGBot";

import { renderLoop } from "./renderer";
import FelixCamera from "./felixCamera";

import Clockface from "./clockFace";

import Director from "./Director";

const scene = new Scene();

let sceneMade = false;
let loopHooks: Array<(dt: number, elapsed: number) => void> = [];

const _barrierCheckV = new Vector3();

const createStageMaterial = () => {
    const mat = new MeshPhongMaterial({
        color: new Color(0.7, 0.7, 0.7),
        shininess: 1000,
    });
    return mat;
};

const findWithName = (group: Group, name: string): Mesh => {
    const mesh = group.children.find(m => m.name === name);
    if (!mesh) throw new Error(`Crash error for unknown model name ${name}`);
    if (!(mesh instanceof Mesh)) throw new Error(`Found non-mesh by name`);
    return mesh;
};

const decipherAndSetClockNumberOne = (scene: Scene, gltfGroup: Group) => {

    const clockNumberNames = [
        "Twelve", "One", "Two", "Three", "Four",
        "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven"
    ].map(s => `${s}Normal`);

    const clockNumberMeshes = clockNumberNames.map(name => {
        const mesh = findWithName(gltfGroup, name).clone();
        mesh.position.set(0, 0, 0);
        mesh.scale.set(2, 2, 2);
        return mesh;
    });

    const radius = 275;

    let c = 0;

    for (let i = 0; i < 12; i++) {
        const numMesh = clockNumberMeshes[c].clone();
        c = c + 1;
        const d = (-Math.PI / 2) + ((Math.PI / 6) * i);
        numMesh.position.z = Math.sin(d) * radius;
        numMesh.position.x = Math.cos(d) * radius;
        numMesh.rotation.y = i * (-Math.PI / 6) + (Math.PI / 2);
        scene.add(numMesh);
        if (c > clockNumberMeshes.length - 1) {
            c = 0;
        }
    }
};

const getWeaponMeshes = (gltfGroup: Group) => {
    const names = ["One", "Two", "Three", "Four", "Five"].map(s => `${s}Weapon`);
    return names.map(n => findWithName(gltfGroup, n));
};

(async () => {

    const models = await loadModels();
    const masterCylinderGroup = models[0].scene;
    const clockNumsGroup = models[1].scene;

    masterCylinderGroup.scale.set(5, 5, 5);
    clockNumsGroup.scale.set(2, 2, 2);

    const keyboard = new KeyboardInterface();
    const FELIX_SIZE = 18;

    const itsMeFelix = new SpritePlane(
        felixWalkSheetUrl,
        FELIX_SIZE * 0.69, FELIX_SIZE,
        5,
        6,
        175 / 2
    );

    const fCam = new FelixCamera(itsMeFelix, scene);

    renderLoop(scene, fCam.camera, (dt, elapsed) => {

        // console.log(dt);
        // console.log(elapsed);

        if (sceneMade === false) {

            sceneMade = true;

            const amb = new AmbientLight(0xffffff, 1);
            scene.add(amb);

            const groundG = new CylinderGeometry(300, 300, 2, 12, 2);
            let groundMat: Material = createStageMaterial();
            const ground = new Mesh(groundG, groundMat);
            ground.name = "ground";

            groundG.computeBoundingSphere();
            const boundingSphere = groundG.boundingSphere;

            if (boundingSphere) {
                boundingSphere.radius = boundingSphere.radius * 0.975;
            }

            ground.rotation.z = Math.PI;

            scene.add(ground);

            decipherAndSetClockNumberOne(scene, clockNumsGroup);

            scene.add(itsMeFelix.mesh);

            let felixWalking = false;
            let felixFlipped = false;
            const FELIX_SPEED = 1;

            loopHooks.push((dt, elapsed) => {

                const movementToTimeScale = elapsed / 16.66667; // A smooth 60fps.

                let xDelta = 0;
                let zDelta = 0;

                const speedThisFrame = FELIX_SPEED * movementToTimeScale;

                if (keyboard.dDown) {
                    xDelta += speedThisFrame;
                }
                if (keyboard.aDown) {
                    xDelta -= speedThisFrame;
                }
                if (keyboard.wDown) {
                    zDelta -= speedThisFrame;
                }
                if (keyboard.sDown) {
                    zDelta += speedThisFrame;
                }

                if (xDelta !== 0 || zDelta !== 0) {

                    _barrierCheckV.copy(itsMeFelix.mesh.position);

                    _barrierCheckV.x += xDelta;
                    _barrierCheckV.z += zDelta;

                    if (boundingSphere && boundingSphere.containsPoint(_barrierCheckV)) {

                        felixWalking = true;
                        itsMeFelix.mesh.position.copy(_barrierCheckV);

                        if (xDelta !== 0) {
                            felixFlipped = xDelta < 0;
                        }

                    } else {
                        felixWalking = false;
                    }

                } else {
                    felixWalking = false;
                }

                const TURN_DELTA = 10;
                if (felixWalking && zDelta !== 0) {
                    if (zDelta > 0) {
                        if (felixFlipped) {
                            itsMeFelix.mesh.rotation.z = Math.PI / TURN_DELTA;
                        } else {
                            itsMeFelix.mesh.rotation.z = -Math.PI / TURN_DELTA;
                        }
                    } else if (zDelta < 0) {
                        if (felixFlipped) {
                            itsMeFelix.mesh.rotation.z = -Math.PI / TURN_DELTA;
                        } else {
                            itsMeFelix.mesh.rotation.z = Math.PI / TURN_DELTA;
                        }
                    }
                } else {
                    itsMeFelix.mesh.rotation.z = 0;
                }

            });

            loopHooks.push((dt) => {
                fCam.runUpdate(dt);
                itsMeFelix.update(dt, felixFlipped, felixWalking);
            });

            OGBot.MODEL_GROUP = masterCylinderGroup;

            const theDirector = new Director(dt, scene, fCam);

            const bullet = new Bullet();
            scene.add(bullet.mesh);
            theDirector.addWeapon(bullet);

            const clockWeaponMeshes = getWeaponMeshes(clockNumsGroup);

            const numberOneWeapon = new One(clockWeaponMeshes[0], scene);
            scene.add(numberOneWeapon.group);
            theDirector.addWeapon(numberOneWeapon);

            const numberTwoWeapon = new Two(clockWeaponMeshes[1], scene);
            scene.add(numberTwoWeapon.group);
            theDirector.addWeapon(numberTwoWeapon);

            const numberThreeWeapon = new Three(clockWeaponMeshes[2], scene);
            scene.add(numberThreeWeapon.group);
            theDirector.addWeapon(numberThreeWeapon);

            const numberFourWeapon = new Four(clockWeaponMeshes[3], scene);
            scene.add(numberFourWeapon.group);
            theDirector.addWeapon(numberFourWeapon);

            const numberFiveWeapon = new Five(clockWeaponMeshes[4], scene);
            scene.add(numberFiveWeapon.group);
            theDirector.addWeapon(numberFiveWeapon);

            // Six: a staff/wand that hovers at 6 and fires homing projectiles.

            // Seven: Garlic+attract orb combo

            // Eight: smoke stacks that appear on random enemies every 8 seconds 
            // and emit a light cloud/damage zone, like santa water

            // Nine: lightning ring instant area explosion on
            // random enemy who's X is less than Felix's

            // Ten: cross/boomerang that fly out at 10

            // Eleven: vamp survivors axes that fly out at 11oclock angle

            // Twelve: Clock lancet.

            loopHooks.push((dt, elapsed) => {
                theDirector.update(dt, elapsed);
            });

            const clockFace = new Clockface(dt);
            scene.add(clockFace.secondsHand);
            scene.add(clockFace.minuteHand);
            scene.add(clockFace.mSecondsHand);

            loopHooks.push((dt) => {
                clockFace.update(dt);
            });

        }

        loopHooks.forEach(fn => fn(dt, elapsed));

    });

})();


