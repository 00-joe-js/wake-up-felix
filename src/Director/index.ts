import { MathUtils, Object3D, Scene, Vector2 } from "three";


import Weapon from "../weapons/OGBullet";
import TwoDEnemy from "../enemies/2DEnemy";
import DrawnEnemy, { getRandomEnemyName, getRandomEnemyFromEra, Era } from "../enemies/DrawnEnemies";

import DamagePlane from "../damageNumbers";
import GemsManager from "../gems";

import FelixCamera from "../felixCamera";

const range = (n: number) => {
    return new Array(n).fill("").map((_, i) => i);
};

export default class Director {

    public allEnemies: TwoDEnemy[] = [];
    public allWeapons: Weapon[] = [];
    public felix: FelixCamera;

    private startTime: number;
    private scene: Scene;
    private tick: number = -1;

    private damageNumbers: DamagePlane;

    private gemsManager: GemsManager;
    private gemFnCollection: ((dt: number, p: Vector2) => boolean | null)[] = [];

    constructor(creationTime: number, scene: Scene, felix: FelixCamera) {
        this.startTime = creationTime;
        this.scene = scene;
        this.felix = felix;
        this.damageNumbers = new DamagePlane();
        this.gemsManager = new GemsManager(this.scene);
    }

    private makeEraEnemy(era: string) {
        const newEnemy = new DrawnEnemy(getRandomEnemyFromEra(era));
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    private getCurrentEra(dt: number) {
        const ERA_TIME = (1000) * (60) * (1);
        const timeSinceStart = dt - this.startTime;
        const eraIndex = Math.floor(timeSinceStart / ERA_TIME);
        const currentEra = ["stoneage", "ancient", "industrial", "prohibition"][eraIndex];
        return currentEra;
    }

    public addWeapon(weapon: Weapon) {
        this.allWeapons.push(weapon);
    }

    private runWorldTick(dt: number) {
        const secondRoundedDown = Math.floor(dt / 1000);
        if (secondRoundedDown > this.tick) {
            this.tick = secondRoundedDown;
            if (this.tick % 2 === 0) {
                const era = this.getCurrentEra(dt)
                range(1).forEach(() => this.makeEraEnemy(era));
            }
        }
    }

    private runWeaponMovement(dt: number, felixPos: Vector2) {
        this.allWeapons.forEach(w => w.update(dt, felixPos));
    }

    private processWeaponCollisions(enemy: TwoDEnemy, dt: number, destroyedEnemies: TwoDEnemy[]): boolean {

        let killed = false;

        this.allWeapons.forEach(weapon => {

            const weaponCollide = weapon.detectCollision(enemy);

            if (weaponCollide) {

                // To be replaced with weapon properties.
                const weaponDamage = MathUtils.randInt(5, 8);

                const hitTakenAndShouldDie = enemy.takeDamage(weaponDamage, weapon, dt);

                if (hitTakenAndShouldDie !== null) {

                    // This logic can be moved to damageNumbers.
                    const enemyPos = enemy.object.position.clone();
                    const { x: viewPortX, y: viewPortY } = enemyPos.project(this.felix.camera);
                    this.damageNumbers.showNumber(weaponDamage, viewPortX, viewPortY);

                    weapon.onEnemyCollide();

                    if (hitTakenAndShouldDie) {
                        enemy.object.visible = false;
                        requestAnimationFrame(() => {
                            this.scene.remove(enemy.object);
                        });
                        destroyedEnemies.push(enemy);
                        this.gemFnCollection.push(this.gemsManager.placeGem(enemy.object.position.x, enemy.object.position.z));
                        killed = true;
                    }

                }

            }

        });

        return killed;

    }

    private processFelixCollision(enemy: TwoDEnemy, dt: number) {
        const felixPosition = this.felix.getPosition();
        const felixCollide = enemy.collidesWith(felixPosition);

        if (felixCollide) {
            this.felix.takeDamage(dt);
        }
    }

    update(dt: number) {

        const felixPos = this.felix.getPosition();

        this.runWeaponMovement(dt, felixPos);

        const destroyedEnemiesThisFrame: TwoDEnemy[] = [];

        this.allEnemies.forEach((enemy) => {

            if (enemy.object.visible === false) return;

            /* Every frame enemies should:
                Detect collision with Felix the Cat.
                Detect collisions with weapons (with hit delay).
                Move towards Felix the Cat.
            */

            const killedThisFrame = this.processWeaponCollisions(enemy, dt, destroyedEnemiesThisFrame);

            if (!killedThisFrame) {
                enemy.moveTowards(felixPos, dt);
                this.processFelixCollision(enemy, dt);
            }

        });

        if (destroyedEnemiesThisFrame.length > 0) {
            this.allEnemies = this.allEnemies.filter(enemy => {
                return !destroyedEnemiesThisFrame.includes(enemy);
            });
        }

        this.gemFnCollection.forEach((checkPickup) => {
            const gemPickedUp = checkPickup(dt, felixPos);
            if (gemPickedUp === true) {
                console.log("You got XP. :)");
                this.gemFnCollection = this.gemFnCollection.filter(f => f !== checkPickup);
            }
        });

        this.runWorldTick(dt);

    }

}