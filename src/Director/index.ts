import { MathUtils, Object3D, Scene } from "three";

import Weapon from "../weapons/OGBullet";
import OGBot from "../enemies/OGBot";
import DamagePlane from "../damageNumbers";
import GemsManager from "../gems";
import { withinDistance2D } from "../utils";

import FelixCamera from "../felixCamera";

const range = (n: number) => {
    return new Array(n).fill("").map((_, i) => i);
};

export default class Director {

    public allEnemies: OGBot[] = [];
    public allWeapons: Weapon[] = [];
    public felix: FelixCamera;

    private startTime: number;
    private scene: Scene;
    private tick: number = -1;

    private damageNumbers: DamagePlane;

    private gemsManager: GemsManager;
    private gemFnCollection: ((dt: number, felix: Object3D) => boolean)[] = [];

    constructor(creationTime: number, scene: Scene, felix: FelixCamera) {
        this.startTime = creationTime;
        this.scene = scene;
        this.felix = felix;
        this.damageNumbers = new DamagePlane();
        this.gemsManager = new GemsManager(this.scene);
    }

    private makeEnemy() {
        const newEnemy = new OGBot();
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    public addWeapon(weapon: Weapon) {
        this.allWeapons.push(weapon);
    }

    private runTick(dt: number) {
        const secondRoundedDown = Math.floor(dt / 1000);
        if (secondRoundedDown > this.tick) {
            this.tick = secondRoundedDown;
            if (this.tick % 7 === 0) {
                range(15).forEach(() => this.makeEnemy());
            }
        }
    }

    private runWeaponMovement(dt: number) {
        this.allWeapons.forEach(w => w.update(dt, this.felix.object));
    }

    update(dt: number) {
        this.runWeaponMovement(dt);
        const destroyedEnemies: OGBot[] = [];

        this.allEnemies.forEach((enemy) => {

            /* Every frame enemies should:
                Detect collision with Felix the Cat.
                Detect collisions with weapons (with hit delay).
                Move towards Felix the Cat.
            */


            this.allWeapons.forEach(weapon => {
                const enemyX = enemy.object.position.x;
                const enemyY = enemy.object.position.z;
                const weaponCollide = weapon.detectCollision(enemyX, enemyY);
                if (weaponCollide) {

                    const { x: viewPortX, y: viewPortY } = enemy.object.position.project(this.felix.camera);

                    this.damageNumbers.showNumber(MathUtils.randInt(10, 15), viewPortX, viewPortY);
                    weapon.onEnemyCollide();

                    this.scene.remove(enemy.object);
                    destroyedEnemies.push(enemy);

                    this.gemFnCollection.push(this.gemsManager.placeGem(enemyX, enemyY));

                } else {

                    const felixCollide = withinDistance2D(5, enemyX, this.felix.object.position.x, enemyY, this.felix.object.position.z);

                    if (felixCollide) {
                        this.felix.takeDamage(dt);
                    }

                }
            });


            enemy.moveTowards(this.felix.object, dt);

            this.gemFnCollection.forEach((checkPickup) => {
                const gemPickedUp = checkPickup(dt, this.felix.object);
                if (gemPickedUp) {
                    console.log("You got XP. :)");
                    this.gemFnCollection = this.gemFnCollection.filter(f => f !== checkPickup);
                }
            });

        });

        if (destroyedEnemies.length > 0) {
            this.allEnemies = this.allEnemies.filter(enemy => {
                return !destroyedEnemies.includes(enemy);
            });
        }

        this.runTick(dt);
    }

}