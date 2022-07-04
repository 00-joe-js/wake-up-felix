import { BufferGeometry, MathUtils, Mesh, MeshStandardMaterial, Scene, Vector2 } from "three";

import { pauseRendering, resumeRendering } from "../renderer";

import Weapon from "../weapons";
import TwoDEnemy from "../enemies/2DEnemy";
import DrawnEnemy, { getRandomEnemyFromEra, getRandomEnemyName } from "../enemies/DrawnEnemies";
import ClockNumEnemy from "../enemies/ClockNum";


type GameEnemy = TwoDEnemy | ClockNumEnemy;

import DamagePlane from "../damageNumbers";
import GemsManager from "../gems";

import FelixCamera from "../felixCamera";

import { UIMethods } from "../gameUI";
import Baggie from "../Baggie";

const range = (n: number) => {
    return new Array(n).fill("").map((_, i) => i);
};

import AudioClip, {
    spawnAncient, spawnStoneAge, spawnIndustrial, spawnProhibition,
    upgradeShow, finalLoop, upgradeLoop,
    stoneageMusic, ancientMusic, industrialMusic, prohibitionMusic
} from "../Audio";

import shuffleArray from "shuffle-array";

const ERAS = ["stoneage", "ancient", "industrial", "prohibition"];

const eraSpawns: { [k: string]: AudioClip } = {
    "stoneage": spawnStoneAge,
    "ancient": spawnAncient,
    "industrial": spawnIndustrial,
    "prohibition": spawnProhibition
};

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

    // Upgrade stuff.
    private increaseSpeed: Function;
    private weaponDamageScalar: number = 1;
    private enemyMovementScalar: number = 1;

    private lastTimeUpdateFramesAgo: number = 0;
    private endingSequenceBeginTime: number | null = null;
    private endingStarted: boolean = false;
    private endingFightStartTime: number | null = null;

    private specificWeaponScalars: { [k: string]: number } = {};

    private cancelTempUpgradeFns: Function[] = [];

    private scaleMinuteForTesting: number = 1;

    public currentSong: AudioClip = stoneageMusic;

    private extraPickupsSafeguard: { [k: string]: true } = {};

    constructor(
        creationTime: number,
        scene: Scene,
        felix: FelixCamera,
        ui: UIMethods,
        clockNumMeshes: Mesh<BufferGeometry, MeshStandardMaterial>[],
        increaseSpeed: Function,
    ) {
        this.startTime = creationTime;
        this.scene = scene;
        this.felix = felix;
        this.ui = ui;
        this.clockNumMeshes = clockNumMeshes;
        this.damageNumbers = new DamagePlane();
        this.baggie = new Baggie(this.scene);
        this.gemsManager = new GemsManager(this.scene, this.ui);
        this.increaseSpeed = increaseSpeed;
    }

    private makeEraEnemy(era: string) {
        const newEnemy = new DrawnEnemy(getRandomEnemyFromEra(era));
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    private makeAnyEnemy() {
        const newEnemy = new DrawnEnemy(getRandomEnemyName());
        this.scene.add(newEnemy.object);
        this.allEnemies.push(newEnemy);
    }

    private makeEnemyWithName(name: string) {
        const e = new DrawnEnemy(name);
        this.scene.add(e.object);
        this.allEnemies.push(e);
        return e;
    }

    private getCurrentMinute(dt: number) {
        return Math.floor(dt / (1000 * (60 * this.scaleMinuteForTesting)));
    }

    private getCurrentEra(dt: number) {
        const ERA_TIME = (1000) * (60 * this.scaleMinuteForTesting) * (3);
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

    public activateWeapon(minute: number, scalar: number = 1) {
        const weapon = this.arsenal.get(minute);

        if (!weapon) {
            throw new Error(`Failure to activate unknown weapon: ${minute}`);
        }

        // Special effects.
        if (minute === 5) {
            this.felix.maxHealth = 5;
            this.felix.health += 1;
            this.ui.setFelixHP(this.felix.health);
            this.ui.increaseFelixMaxHP();
        } else if (minute === 7) {
            this.gemsManager.increaseGemPickupDistance(30);
        }

        this.addWeapon(weapon);
        this.specificWeaponScalars[minute] = scalar;

    }

    private activateMinuteReached(newMinute: number, dt: number) {

        if (newMinute === 12) {
            this.endingSequenceBeginTime = dt;
            this.ui.startEndingSequence();
        }

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

        const currentEra = this.getCurrentEra(dt);

        const spawnSound = eraSpawns[currentEra];

        if (spawnSound) {
            spawnSound.play();
        }

    }

    private createClockNumberEnemy(): ClockNumEnemy {

        const useIndex = this.canonicalGameMinute === 12 ? 0 : this.canonicalGameMinute;
        const correctMesh = this.clockNumMeshes[useIndex];

        const clockEnemy = new ClockNumEnemy(
            // @ts-ignore
            this.canonicalGameMinute,
            correctMesh,
        );

        this.allEnemies.push(clockEnemy);

        return clockEnemy;

    }

    private runEndingTick(dt: number) {
        if (this.endingSequenceBeginTime && this.endingStarted) {
            if (this.endingFightStartTime === null) {
                this.endingFightStartTime = dt;
            }
            const t = Math.floor(dt / 1000);
            if (t > this.tick) {

                const timeElapsed = dt - this.endingFightStartTime;
                const timeRemaining = 60 * 1000 - timeElapsed;
                this.tick = t;

                this.ui.setTime(timeRemaining, true);

                if (timeElapsed > (60 * 1000)) {
                    // Victory
                    pauseRendering();
                    finalLoop.pause();
                    this.ui.storeCurrentXPInBag(13);
                    this.currentSong.pause();
                    // Need for leaderboard: xptotal (on gs), weapons (on gs)
                    this.ui.showVictoryScreen();
                } else {
                    this.makeAnyEnemy();
                    this.makeAnyEnemy();
                    this.makeAnyEnemy();
                    this.makeAnyEnemy();
                }

            }
        }
    }

    private runWorldTick(dt: number) {

        if (this.endingSequenceBeginTime !== null) {
            return this.runEndingTick(dt);
        }

        const TIME_UPDATE_FR = 10;
        if (this.lastTimeUpdateFramesAgo === TIME_UPDATE_FR) {
            this.ui.setTime(dt);
            this.lastTimeUpdateFramesAgo = 0;
        } else {
            this.lastTimeUpdateFramesAgo++;
        }

        if (this.tick === 1) {
            this.ui.setEraMessage("Prehistoric Era")
        } else if (this.tick === 60 * 3) {
            this.ui.setEraMessage("Ancient History");
        } else if (this.tick === 60 * 6) {
            this.ui.setEraMessage("Industrial Revolution");
        } else if (this.tick === 60 * 9) {
            this.ui.setEraMessage("1920s")
        }

        if (this.tick > 1 && this.tick < 5) {
            this.currentSong = stoneageMusic;
            this.currentSong.play();
        } else if (this.tick === 181 * 1) {
            this.currentSong.pause();
            this.currentSong = ancientMusic;
            this.currentSong.play();
        } else if (this.tick === 181 * 2) {
            this.currentSong.pause();
            this.currentSong = industrialMusic;
            this.currentSong.play();
        } else if (this.tick === 181 * 3) {
            this.currentSong.pause();
            this.currentSong = prohibitionMusic;
            this.currentSong.play();
        }

        const thisMinute = this.getCurrentMinute(dt);
        if (thisMinute > this.canonicalGameMinute) {
            this.activateMinuteReached(thisMinute, dt);
            return;
        }

        const secondRoundedDown = Math.floor(dt / 1000);
        if (secondRoundedDown > this.tick) {
            this.tick = secondRoundedDown;

            if (this.tick % 5 === 0) {

                const era = this.getCurrentEra(dt);

                if (Math.random() < .7) {
                    range(this.tickToEnemyRate(this.tick)).forEach(() => this.makeEraEnemy(era));
                } else {
                    this.activateFunEraEvent(era);
                }

            }

        }
    }

    private tickToEnemyRate(t: number): number {

        const warmedUp = 20;
        const threeMins = 180;
        const fiveMins = 300;
        const eightMins = 480;
        const tenMins = 600;
        const lastEraMusicChange = 645;

        if (t < warmedUp) {
            return 1;
        }

        if (t < threeMins) {
            return 2;
        }

        if (t < fiveMins) {
            return 3;
        }

        if (t < eightMins) {
            return 4;
        }

        if (t < tenMins) {
            return 5;
        }

        if (t < lastEraMusicChange) {
            return 6;
        }

        return 7;

    }

    private activateFunEraEvent(era: string) {


        if (era === "stoneage") {

            const eventFns = shuffleArray([
                // Cavecat clan
                () => {
                    const cats = [
                        this.makeEnemyWithName("Cave Cat"),
                        this.makeEnemyWithName("Cave Cat"),
                        this.makeEnemyWithName("Cave Cat")
                    ];
                    cats[1].object.position.copy(cats[0].object.position);
                    cats[1].object.position.x += 30;
                    cats[2].object.position.copy(cats[0].object.position);
                    cats[2].object.position.z += 30;
                },
                // Steggodawg ambush
                () => {
                    this.makeEnemyWithName("Steggodog");
                    this.makeEnemyWithName("Steggodog");
                    this.makeEnemyWithName("Steggodog");
                    this.makeEnemyWithName("Steggodog");
                    this.makeEnemyWithName("Steggodog");
                }
            ]);

            eventFns[0]();

        } else if (era === "ancient") {

            const eventFns = shuffleArray([
                // Ostrich Herd
                () => {
                    const os = [
                        this.makeEnemyWithName("Ostrich"),
                        this.makeEnemyWithName("Ostrich"),
                        this.makeEnemyWithName("Ostrich"),
                        this.makeEnemyWithName("Ostrich"),
                        this.makeEnemyWithName("Ostrich"),
                        this.makeEnemyWithName("Ostrich"),
                    ];
                    os.forEach(o => {
                        o.object.position.copy(os[0].object.position);
                        o.object.position.x += MathUtils.randInt(-70, 70);
                        o.object.position.z += MathUtils.randInt(-70, 70);
                    });
                },
                // Army
                () => {
                    this.makeEnemyWithName("Roman Soldier");
                    this.makeEnemyWithName("Roman Soldier");
                    this.makeEnemyWithName("Roman Soldier");
                    this.makeEnemyWithName("Roman Soldier");
                    this.makeEnemyWithName("Roman Soldier");
                    this.makeEnemyWithName("Viking Cat");
                    this.makeEnemyWithName("Viking Cat");
                    this.makeEnemyWithName("Viking Cat");
                    this.makeEnemyWithName("Viking Cat");
                    this.makeEnemyWithName("Viking Cat");
                    this.makeEnemyWithName("Viking Cat");

                }
            ]);

            eventFns[0]();

        } else if (era === "industrial") {

            const eventFns = shuffleArray([
                // Trains
                () => {
                    const os = [
                        this.makeEnemyWithName("Steam Engine"),
                        this.makeEnemyWithName("Steam Engine"),
                    ];
                    os.forEach(o => {
                        o.object.position.copy(os[0].object.position);
                        o.object.position.x += MathUtils.randInt(-100, 100);
                        o.object.position.z += MathUtils.randInt(-100, 100);
                    });
                },
                // Army
                () => {
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");
                    this.makeEnemyWithName("Chimney Sweep");

                },
                // Rats Ambush
                () => {
                    this.makeEnemyWithName("Rats");
                    this.makeEnemyWithName("Rats");
                    this.makeEnemyWithName("Rats");
                    this.makeEnemyWithName("Rats");
                }
            ]);

            eventFns[0]();

        } else if (era === "prohibition") {

            const eventFns = shuffleArray([
                // Girls Night Out
                () => {
                    const os = [
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Flapper"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                    ];
                    os.forEach(o => {
                        o.object.position.copy(os[0].object.position);
                        o.object.position.x += MathUtils.randInt(-100, 100);
                        o.object.position.z += MathUtils.randInt(-100, 100);
                    });
                },
                // Musics
                () => {
                    const os = [this.makeEnemyWithName("Tuba Guy"),
                    this.makeEnemyWithName("Tuba Guy"),
                    this.makeEnemyWithName("Tuba Guy"),
                    this.makeEnemyWithName("Trouble Clef"),
                    this.makeEnemyWithName("Trouble Clef"),
                    this.makeEnemyWithName("Trouble Clef"),
                    this.makeEnemyWithName("Trouble Clef"),
                    this.makeEnemyWithName("Trouble Clef"),
                    this.makeEnemyWithName("Trouble Clef"),
                    ];
                    os.forEach(o => {
                        o.object.position.copy(os[0].object.position);
                        o.object.position.x += MathUtils.randInt(-50, 50);
                        o.object.position.z += MathUtils.randInt(-50, 50);
                    });
                },
                // Getting Crunk
                () => {
                    const os = [
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                        this.makeEnemyWithName("Wine Bottle"),
                    ];
                    os.forEach(o => {
                        o.object.position.copy(os[0].object.position);
                        o.object.position.x += MathUtils.randInt(-100, 100);
                        o.object.position.z += MathUtils.randInt(-100, 100);
                    });
                }
            ]);

            eventFns[0]();

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

                let weaponDamage = MathUtils.randInt(weapon.minDamage, weapon.maxDamage);
                if (weapon.minute) {
                    const thisWeaponsScalar = this.specificWeaponScalars[weapon.minute];
                    if (typeof thisWeaponsScalar === "undefined") throw new Error("Missing weapon scalar??");
                    weaponDamage *= thisWeaponsScalar;
                }
                weaponDamage *= this.weaponDamageScalar;
                weaponDamage = Math.ceil(weaponDamage);

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
                                this.gemsManager.placeGem(enemy.object.position.x, enemy.object.position.z, enemy.increasedRarity)
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
            const ded = this.felix.takeDamage(dt);
            if (ded) {
                this.currentSong.pause();
                finalLoop.pause();
            }
        }
    }

    private applyGeneralUpgrade(id: string, scalingFactor: number) {

        this.cancelTempUpgradeFns.forEach(f => f());
        this.cancelTempUpgradeFns = [];

        switch (id) {
            case "MORE_SPEED":
                this.increaseSpeed(0.2 * scalingFactor);
                break;
            case "MORE_WEAPON_DAMAGE":
                this.weaponDamageScalar += 0.25 * scalingFactor; // 25% more damage.
                break;
            case "HEAL_NOW":
                this.felix.heal(Math.floor(1 * scalingFactor));
                break;
            case "SLOWER_ENEMIES":
                this.enemyMovementScalar -= 0.1 * scalingFactor;
                this.cancelTempUpgradeFns.push(() => {
                    this.enemyMovementScalar = 1;
                });
                break;
            case "PICK_UP_RANGE":
                this.gemsManager.increaseGemPickupDistance(7.5 * scalingFactor);
                break;
            case "FREEZE":
                this.allEnemies.forEach(e => {
                    e.stun += 15000 * scalingFactor;
                });
                break;
            case "LUCKY":
                this.gemsManager.increaseRareChance(0.1 * scalingFactor);
                break;
            default:
                throw new Error(`Unknown upgrade id ${id}`);
        }

    }

    private getExpectedXPForMinute(m: number) {
        const minutesToExpected: { [k: string]: number } = {
            "1": 40,
            "2": 50,
            "3": 60,
            "4": 70,
            "5": 80,
            "6": 90,
            "7": 100,
            "8": 120,
            "9": 140,
            "10": 160,
            "11": 180,
            "12": 200,
        };

        const DIV = 1;
        Object.keys(minutesToExpected).forEach((k) => {
            minutesToExpected[k] = minutesToExpected[k] * DIV;
        });

        return minutesToExpected[m.toString()];
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

            if (this.extraPickupsSafeguard[pickedupBag.forMinute] === true) {
                this.bagCollection = this.bagCollection.filter(b => b !== pickedupBag);
                this.scene.remove(pickedupBag.mesh);
            } else {
                this.extraPickupsSafeguard[pickedupBag.forMinute] = true;
                this.bagCollection = this.bagCollection.filter(b => b !== pickedupBag);
                this.scene.remove(pickedupBag.mesh);
                pauseRendering();
                this.currentSong.pause();
                upgradeLoop.play();
                upgradeShow.play();
                this.ui.showUpgradeScreen(
                    pickedupBag.forMinute,
                    this.getExpectedXPForMinute(pickedupBag.forMinute),
                    (choseWeapon: boolean, upgradeId: string | null, scalar: number) => {
                        if (choseWeapon) {
                            this.activateWeapon(pickedupBag.forMinute, scalar);
                            this.ui.addChosenWeapon(pickedupBag.forMinute);
                        } else if (upgradeId) {
                            this.applyGeneralUpgrade(upgradeId, scalar);
                        }
                        this.ui.hideUpgradeScreen();
                        if (pickedupBag.forMinute === 12) {
                            setTimeout(() => {
                                this.endingStarted = true;
                                this.ui.setEraMessage("Survive for one minute!")
                                this.currentSong.pause();
                                upgradeLoop.pause();
                                finalLoop.play();
                                resumeRendering();
                            }, 200);
                        } else {
                            setTimeout(() => {
                                this.currentSong.play();
                                upgradeLoop.pause();
                                resumeRendering();
                            }, 200);
                        }
                    });
            }


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
                enemy.moveTowards(felixPos, dt, elapsed, this.enemyMovementScalar);
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