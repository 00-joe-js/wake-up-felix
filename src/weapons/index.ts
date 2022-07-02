import bulletUrl from "../../assets/bullet.png";

import { Box3, BoxGeometry, CylinderGeometry, Group, MathUtils, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, PointLight, Scene, Sphere, SphereGeometry, Vector2, Vector3 } from "three";

import { shake } from "../renderer";
import SpritePlane from "../SpritePlane";
import { rotateAboutPoint, withinDistance2D } from "../utils";
import TwoDEnemy from "../enemies/2DEnemy";
import ClockNumEnemy from "../enemies/ClockNum";

type GameEnemy = TwoDEnemy | ClockNumEnemy;

export default class Weapon {
    public group: Object3D = new Group();
    public minDamage: number = 0;
    public maxDamage: number = 0;
    public hitDelay: number = 1000;
    public stunValue: number = 500;
    public minute: number | null = null;
    update(dt: number, elapsed: number, pos: Vector2, allEnemies: GameEnemy[]) {
        throw new Error("Not implemented");
    }
    detectCollision(enemy: GameEnemy, dt: number): boolean {
        throw new Error("Not implemented");
    }
    onEnemyCollide(enemy: GameEnemy) {
        throw new Error("Not implemented");
    }
}

export class OGBullet extends Weapon {

    static COLLIDE_DISTANCE: number = 18;

    sprite: SpritePlane;
    group: Mesh;

    stunValue = 1000;

    public minDamage: number = 100;
    public maxDamage: number = 200;

    constructor() {
        super();
        const BULLET_SIZE = 30;
        const BULLET_RATIO = 101 / (664 / 3);
        this.sprite = new SpritePlane(bulletUrl, BULLET_SIZE, BULLET_SIZE * BULLET_RATIO, 5, 3);
        this.group = this.sprite.mesh;
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        const r = Math.sin(dt / 1000);
        const c = Math.cos(dt / 1000);
        this.group.position.x = felixPos.x + (r * 100);
        this.group.position.z = felixPos.y + (Math.sin(dt / 700) * 50);
        this.sprite.update(dt, c < 0, true);
    }

    detectCollision(enemy: GameEnemy): boolean {
        return withinDistance2D(OGBullet.COLLIDE_DISTANCE,
            this.group.position.x, enemy.object.position.x,
            this.group.position.z, enemy.object.position.z);
    }

    onEnemyCollide() {
        shake(200);
    }
}

export class One extends Weapon {
    group: Group;
    modelMesh: Mesh;

    stunValue = 20;
    minDamage: number = 3;
    maxDamage: number = 6;

    minute = 1;

    static ONE_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6)
            .multiplyScalar(5);

    private activeProjectiles: ({ mesh: Mesh, thrownTime: number })[] = [];

    private lastThrowTime: number = 0;

    private collisionLight: PointLight = new PointLight(0xfedf02, 10, 50);

    private scene: Scene;

    private movementVector: Vector3 = new Vector3();

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.collisionLight);
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 20, felixPos.y);
        if (dt - this.lastThrowTime > 1000) {
            const newProjectile = this.modelMesh.clone();
            newProjectile.position.copy(this.group.position);
            this.scene.add(newProjectile);
            newProjectile.rotation.y = -Math.PI / 2 - Math.PI / 6;

            this.activeProjectiles.push({
                mesh: newProjectile,
                thrownTime: dt
            });
            this.lastThrowTime = dt;
        }
        this.activeProjectiles.forEach((proj) => {
            this.movementVector.copy(One.ONE_DIR);
            this.movementVector.multiplyScalar(elapsed / 16.667);
            proj.mesh.position.add(this.movementVector);
            if (dt - proj.thrownTime > 2500) {
                this.activeProjectiles = this.activeProjectiles.filter(i => i !== proj);
                this.scene.remove(proj.mesh);
            }
        });
        this.collisionLight.intensity -= 3;
        this.collisionLight.intensity = Math.max(0, this.collisionLight.intensity);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return this.activeProjectiles.some(proj => {
            return withinDistance2D(
                15,
                proj.mesh.position.x, enemy.object.position.x,
                proj.mesh.position.z, enemy.object.position.z
            );
        });
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
        this.collisionLight.position.copy(enemy.object.position);
        this.collisionLight.intensity = 50;
    }
}

export class Two extends Weapon {

    group: Group;
    modelMesh: Mesh;

    stunValue = 2500;
    minDamage: number = 10;
    maxDamage: number = 20;

    minute = 2;

    static TWO_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6 * 2);

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.modelMesh = mesh;
        this.group.add(this.modelMesh);
        this.modelMesh.scale.set(1.5, 1.5, 1.5);
        this.modelMesh.position.z = -30;
        this.modelMesh.rotation.y = -Math.PI / 2;
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 20, felixPos.y);

        this.group.rotation.y -= 0.075 * (elapsed / 16.667);

        if (this.group.rotation.y < -Math.PI * 2) {
            this.group.rotation.y = 0;
        }

        let s = (1 + (1 - Math.sin(this.group.rotation.y))) / 2;
        s = s * 2;
        this.modelMesh.scale.set(s, s, s);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        const twoWorldPos = this.modelMesh.position.clone().applyMatrix4(this.group.matrixWorld);

        const check = withinDistance2D(
            25,
            twoWorldPos.x, enemy.object.position.x,
            twoWorldPos.z, enemy.object.position.z,
        );

        return check;
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
        shake(500);
    }
}

export class Three extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    traps: { mesh: Mesh }[] = [];

    minDamage = 3;
    maxDamage = 3;
    stunValue = 300;
    hitDelay = 600;

    minute = 3;

    private lastPlace: number = 0;

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(2, 2, 2);
        this.modelMesh.position.y = 5;
    }

    placeTrap(dt: number, felixPos: Vector2) {
        const m = this.modelMesh.clone();
        this.scene.add(m);
        m.position.set(felixPos.x + 30, 5, felixPos.y);
        this.traps.push({ mesh: m });
        this.lastPlace = dt;
    }

    removeOldestTrap() {
        this.scene.remove(this.traps[0].mesh);
        this.traps = this.traps.slice(1);
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        if (dt - this.lastPlace > 3000) {
            this.placeTrap(dt, felixPos);
            if (this.traps.length > 3) {
                this.removeOldestTrap();
            }
        }
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return this.traps.some(trap => {
            return withinDistance2D(
                25,
                trap.mesh.position.x, enemy.object.position.x,
                trap.mesh.position.z, enemy.object.position.z,
            );
        });
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
    }
}

export class Four extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    private hitboxMesh: Mesh;

    private hitboxPosV: Vector3 = new Vector3();

    minDamage = 15;
    maxDamage = 25;
    stunValue = 1000;
    hitDelay = 1000;

    minute = 4;

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.group.add(this.modelMesh);

        this.modelMesh.position.x = -30;
        this.modelMesh.scale.set(1.5, 1.5, 1.5);
        rotateAboutPoint(this.modelMesh, new Vector3(0, 0, 0), new Vector3(0, 1, 0), Math.PI / 6 * 4, true);

        this.hitboxMesh = new Mesh(new BoxGeometry(12, 12, 12, 1, 1, 1));
        this.hitboxMesh.visible = false;
        this.group.add(this.hitboxMesh);
        this.hitboxMesh.position.x = -40;
        rotateAboutPoint(this.hitboxMesh, new Vector3(0, 0, 0), new Vector3(0, 1, 0), Math.PI / 6 * 4, true);
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 5, felixPos.y);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        this.hitboxPosV.copy(this.hitboxMesh.position);
        this.hitboxPosV.applyMatrix4(this.group.matrixWorld);
        return withinDistance2D(10,
            this.hitboxPosV.x, enemy.object.position.x,
            this.hitboxPosV.z, enemy.object.position.z,
        );
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
    }
}

export class Five extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    minDamage = 15;
    maxDamage = 25;
    stunValue = 1500;
    hitDelay = 3000;

    minute = 5;

    private shields: Mesh[] = [];

    private _v: Vector3 = new Vector3();

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(1.5, 1.5, 1.5);
        this.modelMesh.rotation.y = Math.PI / 2;

        this.shields = new Array(5).fill("").map(() => this.modelMesh.clone());

        this.shields.forEach(s => this.group.add(s));
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 5, felixPos.y);
        let r = -dt / 300;
        this.shields.forEach((s, i) => {
            let d = r + (i * (1000 / 4));
            const xOffset = Math.sin(d) * 50;
            const zOffset = Math.cos(d) * 50;
            s.position.set(xOffset, 5, zOffset);
        });
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return this.shields.some(shield => {
            this._v.copy(shield.position).applyMatrix4(this.group.matrixWorld);
            return withinDistance2D(20,
                this._v.x, enemy.object.position.x,
                this._v.z, enemy.object.position.z,
            );
        });
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
    }
}

export class Six extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 5;
    minDamage = 1;
    maxDamage = 1;
    hitDelay = 0;

    minute = 6;

    private activeProjectiles: ({ mesh: Mesh, target: GameEnemy })[] = [];

    private sourceLight: PointLight = new PointLight(0xddff00, 2, 15);

    private movementVector: Vector3 = new Vector3();
    private findVector: Vector3 = new Vector3();
    private findBox: Box3 = new Box3();

    private shotDelay = 100;
    private lastShotTime = 0;

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.position.z = 25;
        this.sourceLight.position.z = 15;
        this.group.add(this.modelMesh);
        this.group.add(this.sourceLight);
    }

    makeProjectileMesh() {
        const m = new Mesh(
            new SphereGeometry(2, 20, 20),
            new MeshPhongMaterial({ color: 0x99aa00, shininess: 100 })
        );
        return m;
    }

    findEnemyInRange(felixPos: Vector2, allEnemies: GameEnemy[]): GameEnemy | null {
        this.findVector.set(felixPos.x, 0, felixPos.y);
        const zoneSphere = new Sphere(this.findVector, 100);
        zoneSphere.getBoundingBox(this.findBox);
        const enemiesInZone = allEnemies.filter((enemy) => {
            const pos = enemy.object.position;
            const test = this.findBox.containsPoint(pos);
            return test;
        });
        if (enemiesInZone.length === 0) return null;
        return enemiesInZone[MathUtils.randInt(0, enemiesInZone.length - 1)];
    }

    update(dt: number, elapsed: number, felixPos: Vector2, allEnemies: GameEnemy[]) {
        this.group.position.set(felixPos.x, 5, felixPos.y);
        this.modelMesh.rotation.y = -Math.PI / 2 + Math.sin(dt / 500) / 2;

        if (this.activeProjectiles.length < 6) {
            if (dt - this.lastShotTime > this.shotDelay) {
                this.findVector.set(felixPos.x, 0, felixPos.y);
                const zoneSphere = new Sphere(this.findVector, 100);
                zoneSphere.getBoundingBox(this.findBox);
                const enemiesInZone = allEnemies.filter((enemy) => {
                    const pos = enemy.object.position;
                    const test = this.findBox.containsPoint(pos);
                    return test;
                });
                if (enemiesInZone.length !== 0) {
                    const target = enemiesInZone[MathUtils.randInt(0, enemiesInZone.length - 1)];
                    const mesh = this.makeProjectileMesh();
                    mesh.position.copy(this.group.position);
                    mesh.position.z += 15;
                    mesh.position.y = 40;
                    this.lastShotTime = dt;
                    this.scene.add(mesh);
                    this.activeProjectiles.push({
                        target,
                        mesh
                    });
                }
            }
        }

        this.activeProjectiles.forEach((p) => {

            const { mesh, target } = p;

            if (target.isDead) {
                const newTarget = this.findEnemyInRange(felixPos, allEnemies);
                if (newTarget === null) {
                    this.scene.remove(mesh);
                    this.activeProjectiles = this.activeProjectiles.filter(p => p.mesh !== mesh);
                } else {
                    p.target = newTarget;
                }
                return;
            }

            const enemyPos = target.object.position;

            this.movementVector.subVectors(enemyPos, mesh.position);

            this.movementVector.normalize();
            this.movementVector.multiplyScalar(1.5);

            mesh.position.add(this.movementVector);

            const shouldDissapear = withinDistance2D(1, mesh.position.x, enemyPos.x, mesh.position.z, enemyPos.z);

            if (shouldDissapear) {
                this.scene.remove(mesh);
                this.activeProjectiles = this.activeProjectiles.filter(p => p.mesh !== mesh);
            }

        });

    }

    detectCollision(enemy: TwoDEnemy): boolean {
        const projectilesTowardsThisEnemy = this.activeProjectiles.filter(({ target }) => {
            return target === enemy;
        });

        if (projectilesTowardsThisEnemy.length === 0) {
            return false;
        }

        const enemyPos = enemy.object.position;

        const impactingProjectiles = projectilesTowardsThisEnemy.filter(({ mesh }) => {
            return withinDistance2D(5, mesh.position.x, enemyPos.x, mesh.position.z, enemyPos.z);
        });

        if (impactingProjectiles.length > 0) {
            return true;
        } else {
            return false;
        }

    }

    onEnemyCollide(enemy: TwoDEnemy): void {

    }
}

export class Seven extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 150;
    minDamage = 5;
    maxDamage = 10;
    hitDelay = 750;

    minute = 7;

    private sourceLight: PointLight = new PointLight(0xffaa00, 1, 100);

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.group.add(this.modelMesh);
        this.group.add(this.sourceLight);
        this.sourceLight.position.y += 70;
        this.modelMesh.position.x = -30;
        this.modelMesh.scale.set(1.5, 1.5, 1.5);
        rotateAboutPoint(this.modelMesh, new Vector3(0, 0, 0), new Vector3(0, 1, 0), (Math.PI / 6) * 2, true);
    }

    update(dt: number, elapsed: number, felixPos: Vector2, allEnemies: GameEnemy[]) {
        this.group.position.set(felixPos.x, 5, felixPos.y);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        const enemyPos = enemy.object.position;
        const groupPos = this.group.position;
        return withinDistance2D(50, enemyPos.x, groupPos.x, enemyPos.z, groupPos.z);
    }

    onEnemyCollide(enemy: TwoDEnemy): void {

    }
}

export class Eight extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 150;
    minDamage = 5;
    maxDamage = 10;
    hitDelay = 200;

    minute = 8;

    activeStacks: { group: Group, timePlaced: number }[] = [];

    lastPlacedTime: number = -8000;

    private findVector: Vector3 = new Vector3();
    private findBox: Box3 = new Box3();

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.rotation.y = Math.PI / 2;
        this.modelMesh.rotation.x = Math.PI / 10;
        this.modelMesh.position.y = 5;
    }

    findEnemyInRange(felixPos: Vector2, allEnemies: GameEnemy[]): GameEnemy | null {
        this.findVector.set(felixPos.x, 0, felixPos.y);
        const zoneSphere = new Sphere(this.findVector, 100);
        zoneSphere.getBoundingBox(this.findBox);
        const enemiesInZone = allEnemies.filter((enemy) => {
            const pos = enemy.object.position;
            const test = this.findBox.containsPoint(pos);
            return test;
        });
        if (enemiesInZone.length === 0) return null;
        return enemiesInZone[MathUtils.randInt(0, enemiesInZone.length - 1)];
    }

    update(dt: number, elapsed: number, felixPos: Vector2, allEnemies: GameEnemy[]) {

        if (dt - this.lastPlacedTime > 8000) {

            const randomTargetInRange = this.findEnemyInRange(felixPos, allEnemies);

            if (randomTargetInRange) {
                this.lastPlacedTime = dt;
                const g = new Group();
                g.position.copy(randomTargetInRange.object.position);
                g.position.y = 0;
                const smokeStack = this.modelMesh.clone();
                g.add(smokeStack);
                const smoke = new Mesh(
                    new CylinderGeometry(80, 80, 2),
                    new MeshBasicMaterial({ color: 0x222222 })
                );
                smoke.scale.set(0.1, 0.1, 0.1);
                smoke.position.y = 1;
                smoke.name = "smoke";
                g.add(smoke);
                this.scene.add(g);
                this.activeStacks.push({ group: g, timePlaced: dt });
            }

        }

        this.activeStacks = this.activeStacks.filter(({ group, timePlaced }) => {
            if (dt - timePlaced > 7500) {
                this.scene.remove(group);
                return false;
            }
            return true;
        });

        this.activeStacks.forEach(stack => {
            const smokeMesh = stack.group.getObjectByName("smoke");
            if (!smokeMesh) {
                throw new Error("No smoke?");
            }
            if (smokeMesh.scale.x < 1) {
                const n = smokeMesh.scale.x + 0.01;
                smokeMesh.scale.set(n, n, n);
            }
        });

    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return this.activeStacks.some(({ group }) => {
            const enemyPos = enemy.object.position;
            return withinDistance2D(50, enemyPos.x, group.position.x, enemyPos.z, group.position.z);
        });
    }

    onEnemyCollide(enemy: TwoDEnemy): void {

    }
}

export class Nine extends Weapon {
    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 200;
    minDamage = 10;
    maxDamage = 15;
    hitDelay = 500;

    minute = 9;

    private placedCoils: { group: Group, timePlaced: number, lastZapTime: number }[] = [];

    private lightningMesh: Mesh;

    private placeDelay: number = 2500;
    private lastPlacedTime: number = -500;

    private findVector: Vector3 = new Vector3();
    private findBox: Box3 = new Box3();
    private _yellow = 0xffff00;

    private lights: PointLight[] = [
        new PointLight(this._yellow, 1, 80),
        new PointLight(this._yellow, 1, 80),
        new PointLight(this._yellow, 1, 80)
    ];

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(2, 2, 2);
        this.lights.forEach(l => {
            this.scene.add(l);
            l.intensity = 0;
        });
        this.lightningMesh = new Mesh(new CylinderGeometry(1, 5, 70), new MeshBasicMaterial({ color: this._yellow }));
        this.lightningMesh.position.y = 40;
        this.lightningMesh.rotation.y = Math.PI / 2;
        this.lightningMesh.visible = false;
        this.scene.add(this.lightningMesh);
    }

    findEnemyInRange(felixPos: Vector2, allEnemies: GameEnemy[]): GameEnemy | null {
        this.findVector.set(felixPos.x, 0, felixPos.y);
        const zoneSphere = new Sphere(this.findVector, 100);
        zoneSphere.getBoundingBox(this.findBox);
        const enemiesInZone = allEnemies.filter((enemy) => {
            const pos = enemy.object.position;
            const test = this.findBox.containsPoint(pos);
            return test;
        });
        if (enemiesInZone.length === 0) return null;
        return enemiesInZone[MathUtils.randInt(0, enemiesInZone.length - 1)];
    }

    update(dt: number, elapsed: number, felixPos: Vector2, allEnemies: GameEnemy[]) {

        if (dt - this.lastPlacedTime > this.placeDelay && this.placedCoils.length < 3) {

            const randomTarget = this.findEnemyInRange(felixPos, allEnemies);

            if (randomTarget) {
                this.lastPlacedTime = dt;
                const g = new Group();
                const m = this.modelMesh.clone();
                g.add(m);

                g.position.copy(randomTarget.object.position);
                g.position.y = 0;

                this.scene.add(g);

                this.placedCoils.push({
                    group: g,
                    timePlaced: dt,
                    lastZapTime: dt
                });

                this.lights.forEach((light, i) => {
                    if (this.placedCoils[i]) {
                        light.position.copy(this.placedCoils[i].group.position);
                        light.position.y = 10;
                        light.intensity = 2;
                    } else {
                        light.intensity = 0;
                    }
                });

            }

        }

        this.placedCoils = this.placedCoils.filter((coil, i) => {
            if (dt - coil.timePlaced > 9000) {
                this.scene.remove(coil.group);
                this.lights[i].intensity = 0;
                return false;
            }
            return true;
        });

    }

    detectCollision(enemy: TwoDEnemy, dt: number): boolean {

        const enemyPos = enemy.object.position;

        return this.placedCoils.some(coil => {

            const gPos = coil.group.position;

            if (dt - coil.lastZapTime < 100) return false;

            // Slight miss chance.
            if (MathUtils.randFloat(0, 1) < 0.05) {
                this.lightningMesh.visible = false;
                return false;
            }

            const inRange = withinDistance2D(40, enemyPos.x, gPos.x, enemyPos.z, gPos.z);

            if (inRange) {
                coil.lastZapTime = dt;
                this.lightningMesh.visible = true;
                this.lightningMesh.position.set(enemyPos.x, 20, enemyPos.z);
                return true;
            } else {
                return false;
            }
        });

    }

    onEnemyCollide(enemy: TwoDEnemy): void {

    }
}

export class Ten extends Weapon {
    group: Group;
    modelMesh: Mesh;

    stunValue = 250;
    minDamage: number = 3;
    maxDamage: number = 6;
    hitDelay = 500;

    minute = 10;

    private throwDelay: number = 250;

    static ONE_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6)
            .multiplyScalar(5);

    private activeProjectiles: ({ mesh: Mesh, thrownTime: number, dir: Vector3 })[] = [];

    private lastThrowTime: number = 0;

    private collisionLight: PointLight = new PointLight(0xfedf02, 10, 50);

    private scene: Scene;

    private movementVector: Vector3 = new Vector3();

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(0.75, 0.75, 0.75);
        this.scene.add(this.collisionLight);
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 20, felixPos.y);
        if (dt - this.lastThrowTime > this.throwDelay) {
            const newProjectile = this.modelMesh.clone();
            newProjectile.position.copy(this.group.position);
            this.scene.add(newProjectile);
            newProjectile.rotation.y = -Math.PI / 2 - Math.PI / 6;

            const dir = this.movementVector.copy(One.ONE_DIR).clone();

            if (MathUtils.randFloat(0, 1) > 0.5) {
                dir.x *= -1;
            }

            if (MathUtils.randFloat(0, 1) > 0.5) {
                dir.z *= -1;
            }

            dir.normalize();

            this.activeProjectiles.push({
                mesh: newProjectile,
                thrownTime: dt,
                dir
            });
            this.lastThrowTime = dt;
        }
        this.activeProjectiles.forEach((p) => {
            p.dir.normalize();
            p.dir.multiplyScalar(elapsed / 16.667);
            p.dir.multiplyScalar(4);
            p.mesh.position.add(p.dir);
            p.mesh.rotation.y -= 0.3;
            if (dt - p.thrownTime > 1500) {
                this.activeProjectiles = this.activeProjectiles.filter(i => i !== p);
                this.scene.remove(p.mesh);
            }
        });
        this.collisionLight.intensity -= 3;
        this.collisionLight.intensity = Math.max(0, this.collisionLight.intensity);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return this.activeProjectiles.some(proj => {
            return withinDistance2D(
                15,
                proj.mesh.position.x, enemy.object.position.x,
                proj.mesh.position.z, enemy.object.position.z
            );
        });
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
        this.collisionLight.position.copy(enemy.object.position);
        this.collisionLight.intensity = 50;
    }
}

export class Eleven extends Weapon {

    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 300;
    minDamage: number = 10;
    maxDamage: number = 20;

    minute = 11;

    private activeProjectiles: ({ mesh: Mesh, thrownTime: number, dir: Vector3, showDelay: number, shown: boolean })[] = [];
    private lastThrowsTime: number = -11000;
    private delay: number = 11000;

    static ELEVEN_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), (-Math.PI / 6) * 11);

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.scene = scene;
        this.group = new Group();
        this.modelMesh = mesh;
        this.modelMesh.scale.set(2, 2, 2);
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {

        this.group.position.set(felixPos.x, 20, felixPos.y);

        if (dt - this.lastThrowsTime > this.delay) {

            for (let n = 0; n < 11; n++) {
                const newAxe = this.modelMesh.clone();
                this.scene.add(newAxe);
                newAxe.visible = false;
                this.activeProjectiles.push({
                    mesh: newAxe,
                    thrownTime: dt,
                    showDelay: n * 500,
                    shown: false,
                    dir: new Vector3(MathUtils.randFloat(-3, 3), 0, -5)
                });
            }

            this.lastThrowsTime = dt;

        }

        this.activeProjectiles.forEach(p => {

            if (!p.shown) {
                if (dt > p.thrownTime + p.showDelay) {
                    p.shown = true;
                    p.mesh.visible = true;
                    p.mesh.position.set(felixPos.x, 2, felixPos.y);
                } else {
                    return;
                }
            }

            p.mesh.position.add(p.dir);
            p.mesh.rotation.y += 0.1;
            p.dir.z += 0.1;

        });

    }

    detectCollision(enemy: TwoDEnemy): boolean {

        return this.activeProjectiles.some((p) => {
            const pPos = p.mesh.position;
            const ePos = enemy.object.position;
            return withinDistance2D(30, pPos.x, ePos.x, pPos.z, ePos.z);
        });

    }

    onEnemyCollide(enemy: TwoDEnemy): void {

    }
}

export class Twelve extends Weapon {
    group: Group;
    modelMesh: Mesh;
    scene: Scene;

    stunValue = 2000;
    minDamage = 40;
    maxDamage = 50;
    hitDelay = 100;

    minute = 12;

    private tickDelay: number = 1000 / 12;
    private lastTick: number = 0;

    private lights: PointLight[] = [];

    private _v3: Vector3 = new Vector3(0, 0, 0);
    private _axis: Vector3 = new Vector3(0, 1, 0);
    private _box: Box3 = new Box3();

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.group.add(this.modelMesh);
        this.modelMesh.rotation.y = -Math.PI / 2;
        this.modelMesh.position.z = -75;
        this.modelMesh.scale.set(2, 50, 2);

        this.lights.push(new PointLight(0x00ffff), new PointLight(0x00ffff), new PointLight(0x00ffff));

        this.lights.forEach((l, i) => {
            this.group.add(l);
            l.intensity = 1;
            l.distance = 40;
            l.position.z = -50 + -50 * i;
        });

    }

    update(dt: number, elapsed: number, felixPos: Vector2, allEnemies: GameEnemy[]) {
        this.group.position.set(felixPos.x, 15, felixPos.y);

        if (dt - this.lastTick > this.tickDelay) {
            rotateAboutPoint(this.modelMesh, this._v3, this._axis, -Math.PI / 6);
            this.lights.forEach(l => {
                rotateAboutPoint(l, this._v3, this._axis, -Math.PI / 6);
                l.intensity = MathUtils.randFloat(1, 2);
            });
            this.lastTick = dt;
        }

        this.lights.forEach(l => {
            // console.log(l.position.y);
            l.position.y = this.group.position.y + Math.sin(dt / 100) * 5 + 5;
        });

    }

    detectCollision(enemy: TwoDEnemy): boolean {

        this._box.setFromObject(this.modelMesh);
        this._box.expandByScalar(1.5);

        if (this._box.containsPoint(enemy.object.position)) {
            return true;
        }

        return false;
    }

    onEnemyCollide(enemy: TwoDEnemy): void {


    }
}