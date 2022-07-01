import { BufferGeometry, MathUtils, Mesh, MeshStandardMaterial, Scene, Vector2 } from "three";

import Weapon from "../weapons";
import TwoDEnemy from "../enemies/2DEnemy";
import DrawnEnemy, { getRandomEnemyFromEra } from "../enemies/DrawnEnemies";
import ClockNumEnemy from "../enemies/ClockNum";

type GameEnemy = TwoDEnemy | ClockNumEnemy;

import DamagePlane from "../damageNumbers";
import GemsManager from "../gems";

import FelixCamera from "../felixCamera";

import shuffle from "shuffle-array";
import { UIMethods } from "../gameUI";

const range = (n: number) => {
    return new Array(n).fill("").map((_, i) => i);
};

const ERAS = shuffle(["prohibition", "ancient", "industrial", "stoneage"]);

export default class Director {

    public allEnemies: (GameEnemy)[] = [];
    public allWeapons: Weapon[] = [];
    public felix: FelixCamera;

    public canonicalGameMinute = 0;

    private startTime: number;
    private scene: Scene;
    private tick: number = -1;

    private damageNumbers: DamagePlane;
    private clockNumMeshes: Mesh<BufferGeometry, MeshStandardMaterial>[];

    private gemsManager: GemsManager;
    private gemFnCollection: ((dt: number, p: Vector2) => boolean | null)[] = [];

    constructor(creationTime: number, scene: Scene, felix: FelixCamera, ui: UIMethods, clockNumMeshes: Mesh<BufferGeometry, MeshStandardMaterial>[]) {
        this.startTime = creationTime;
        this.scene = scene;
        this.felix = felix;
        this.clockNumMeshes = clockNumMeshes;
        this.damageNumbers = new DamagePlane();
        this.gemsManager = new GemsManager(this.scene, ui);
    }

    private makeEraEnemy(era: string) {
        const newEnemy = new DrawnEnemy(getRandomEnemyFromEra(era));
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    private getCurrentMinute(dt: number) {
        return Math.floor(dt / (1000 * 5));
    }

    private getCurrentEra(dt: number) {
        const ERA_TIME = (1000) * (60) * (1);
        const timeSinceStart = dt - this.startTime;
        const eraIndex = Math.floor(timeSinceStart / ERA_TIME);
        const currentEra = ERAS[eraIndex];
        return currentEra;
    }

    public addWeapon(weapon: Weapon) {
        this.allWeapons.push(weapon);
    }

    private activateMinuteReached(newMinute: number) {
        this.canonicalGameMinute = newMinute;
        this.createClockNumberEnemy();
    }

    private createClockNumberEnemy() {

        const correctMesh = this.clockNumMeshes[this.canonicalGameMinute];

        const clockEnemy = new ClockNumEnemy(correctMesh);

        this.allEnemies.push(clockEnemy);

    }

    private runWorldTick(dt: number) {
        const thisMinute = this.getCurrentMinute(dt);
        if (thisMinute > this.canonicalGameMinute) {
            this.activateMinuteReached(thisMinute);
            return;
        }
        const secondRoundedDown = Math.floor(dt / 1000);
        if (secondRoundedDown > this.tick) {
            this.tick = secondRoundedDown;
            if (this.tick % 2 === 0) {
                const era = this.getCurrentEra(dt)
                range(0).forEach(() => this.makeEraEnemy(era));
            }
        }
    }

    private runWeaponMovement(dt: number, elapsed: number, felixPos: Vector2) {
        this.allWeapons.forEach(w => w.update(dt, elapsed, felixPos));
    }

    private processWeaponCollisions(enemy: GameEnemy, dt: number, destroyedEnemies: GameEnemy[]): boolean {

        let killed = false;

        this.allWeapons.forEach(weapon => {

            const weaponCollide = weapon.detectCollision(enemy);

            if (weaponCollide) {

                // To be replaced with weapon properties.
                // MAYBE this should come from detectCollision,
                // for reasons like the scaling of II
                const weaponDamage = MathUtils.randInt(weapon.minDamage, weapon.maxDamage);

                const hitTakenAndShouldDie = enemy.takeDamage(weaponDamage, weapon, dt);

                if (hitTakenAndShouldDie !== null) {

                    // This logic can be moved to damageNumbers.
                    const enemyPos = enemy.object.position.clone();
                    const { x: viewPortX, y: viewPortY } = enemyPos.project(this.felix.camera);
                    this.damageNumbers.showNumber(weaponDamage, viewPortX, viewPortY);

                    weapon.onEnemyCollide(enemy);

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

    private processFelixCollision(enemy: GameEnemy, dt: number) {
        const felixPosition = this.felix.getPosition();
        const felixCollide = enemy.collidesWith(felixPosition);

        if (felixCollide) {
            this.felix.takeDamage(dt);
        }
    }

    update(dt: number, elapsed: number) {

        const felixPos = this.felix.getPosition();

        this.runWeaponMovement(dt, elapsed, felixPos);

        const destroyedEnemiesThisFrame: GameEnemy[] = [];

        this.allEnemies.forEach((enemy) => {

            if (enemy.object.visible === false) return;

            /* Every frame enemies should:
                Detect collision with Felix the Cat.
                Detect collisions with weapons (with hit delay).
                Move towards Felix the Cat.
            */

            const killedThisFrame = this.processWeaponCollisions(enemy, dt, destroyedEnemiesThisFrame);

            if (!killedThisFrame) {
                enemy.moveTowards(felixPos, dt, elapsed);
                if (enemy.stun <= 0) {
                    this.processFelixCollision(enemy, dt);
                }
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
                this.gemFnCollection = this.gemFnCollection.filter(f => f !== checkPickup);
            }
        });

        this.runWorldTick(dt);

    }

}