import { BufferGeometry, MathUtils, Mesh, MeshStandardMaterial, Scene, Vector2 } from "three";

import { pauseRendering, resumeRendering } from "../renderer";

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
import Baggie from "../Baggie";

const range = (n: number) => {
    return new Array(n).fill("").map((_, i) => i);
};

const ERAS = shuffle(["stoneage", "ancient", "industrial", "prohibition"]);

type BagEntry = { mesh: Mesh, forMinute: number };
type Arsenal = Map<number, Weapon>;

export default class Director {

    public allEnemies: (GameEnemy)[] = [];
    public allWeapons: Weapon[] = [];
    public felix: FelixCamera;

    public canonicalGameMinute = 0;

    private arsenal: Arsenal = new Map();

    private ui: UIMethods;

    private startTime: number;
    private scene: Scene;
    private tick: number = -1;

    private damageNumbers: DamagePlane;
    private clockNumMeshes: Mesh<BufferGeometry, MeshStandardMaterial>[];

    private baggie: Baggie;
    private bagCollection: BagEntry[] = [];

    private gemsManager: GemsManager;
    private gemFnCollection: ((dt: number, p: Vector2) => boolean | null)[] = [];

    constructor(creationTime: number, scene: Scene, felix: FelixCamera, ui: UIMethods, clockNumMeshes: Mesh<BufferGeometry, MeshStandardMaterial>[]) {
        this.startTime = creationTime;
        this.scene = scene;
        this.felix = felix;
        this.ui = ui;
        this.clockNumMeshes = clockNumMeshes;
        this.damageNumbers = new DamagePlane();
        this.baggie = new Baggie(this.scene);
        this.gemsManager = new GemsManager(this.scene, this.ui);
    }

    private makeEraEnemy(era: string) {
        const newEnemy = new DrawnEnemy(getRandomEnemyFromEra(era));
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    private makeEnemyWithName(name: string) {
        const e = new DrawnEnemy(name);
        this.scene.add(e.object);
        this.allEnemies.push(e);
    }

    private getCurrentMinute(dt: number) {
        return Math.floor(dt / (1000 * 15));
    }

    private getCurrentEra(dt: number) {
        const ERA_TIME = (1000) * (60) * (1);
        const timeSinceStart = dt - this.startTime;
        const eraIndex = Math.floor(timeSinceStart / ERA_TIME);
        const currentEra = ERAS[eraIndex];
        return currentEra;
    }

    public addWeapon(weapon: Weapon) {
        this.scene.add(weapon.group);
        this.allWeapons.push(weapon);
    }

    public provideClockWeapons(arsenal: Arsenal) {
        this.arsenal = arsenal;
    }

    public activateWeapon(minute: number) {
        const weapon = this.arsenal.get(minute);

        if (!weapon) {
            throw new Error(`Failure to activate unknown weapon: ${minute}`);
        }

        // Special effects.
        if (minute === 5) {
            this.felix.health += 1;
            this.ui.setFelixHP(this.felix.health);
            this.ui.increaseFelixMaxHP();
        } else if (minute === 7) {
            this.gemsManager.increaseGemPickupDistance(30);
        }

        this.addWeapon(weapon);
    }

    private activateMinuteReached(newMinute: number) {
        this.canonicalGameMinute = newMinute;
        const clockEnemy = this.createClockNumberEnemy();

        const currentXP = this.ui.getGameState().currentXp;

        this.gemsManager.playBaggingEffect(
            this.scene,
            currentXP,
            this.felix,
            clockEnemy.object.position
        );

        this.ui.storeCurrentXPInBag(this.canonicalGameMinute);


    }

    private createClockNumberEnemy(): ClockNumEnemy {

        const correctMesh = this.clockNumMeshes[this.canonicalGameMinute];

        const clockEnemy = new ClockNumEnemy(
            // @ts-ignore
            this.canonicalGameMinute,
            correctMesh,
        );

        this.allEnemies.push(clockEnemy);

        return clockEnemy;

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
                range(2).forEach(() => this.makeEraEnemy(era));
            }
        }
    }

    private runWeaponMovement(dt: number, elapsed: number, felixPos: Vector2) {
        this.allWeapons.forEach(w => w.update(dt, elapsed, felixPos, this.allEnemies));
    }

    private processWeaponCollisions(enemy: GameEnemy, dt: number, destroyedEnemies: GameEnemy[]): boolean {

        let killed = false;

        this.allWeapons.forEach(weapon => {

            const weaponCollide = weapon.detectCollision(enemy, dt);

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

                        if (enemy instanceof ClockNumEnemy) {
                            const mesh = this.baggie.dropBagForPickup(enemy.object.position);
                            this.bagCollection.push({ mesh, forMinute: enemy.minute });
                        } else {
                            this.gemFnCollection.push(
                                this.gemsManager.placeGem(enemy.object.position.x, enemy.object.position.z)
                            );
                        }

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

    private processPickups(dt: number, felixPos: Vector2) {

        const gemsToRemove: Function[] = [];
        this.gemFnCollection.forEach((checkPickup) => {
            const gemPickedUp = checkPickup(dt, felixPos);
            if (gemPickedUp === true) {
                gemsToRemove.push(checkPickup);
            }
        });
        this.gemFnCollection = this.gemFnCollection.filter(f => !gemsToRemove.includes(f));

        const pickedupBags = this.bagCollection.filter(
            b => this.baggie.detectPickups([b.mesh], felixPos).length === 1
        );

        if (pickedupBags.length > 0) {
            // Almost always just 1, and if not the next frame will get the next.
            const pickedupBag = pickedupBags[0];
            pauseRendering();
            this.ui.showUpgradeScreen(pickedupBag.forMinute, (choseWeapon: boolean, upgradeId: string | null) => {
                if (choseWeapon) {
                    this.activateWeapon(pickedupBag.forMinute);
                } else {
                    console.log(`One ${upgradeId}, coming right up!`);
                }
                this.scene.remove(pickedupBag.mesh);
                this.bagCollection = this.bagCollection.filter(b => b !== pickedupBag);
                this.ui.hideUpgradeScreen();
                setTimeout(() => {
                    resumeRendering();
                }, 200);
            });
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

        destroyedEnemiesThisFrame.forEach(e => {
            e.isDead = true;
        });

        if (destroyedEnemiesThisFrame.length > 0) {
            this.allEnemies = this.allEnemies.filter(enemy => {
                return !destroyedEnemiesThisFrame.includes(enemy);
            });
        }

        this.processPickups(dt, felixPos);

        this.runWorldTick(dt);

    }

}