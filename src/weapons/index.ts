import bulletUrl from "../../assets/bullet.png";

import { Box3, BoxGeometry, Group, MathUtils, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, PointLight, Scene, Sphere, SphereGeometry, Vector2, Vector3 } from "three";

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
    update(dt: number, elapsed: number, pos: Vector2, allEnemies: GameEnemy[]) {
        throw new Error("Not implemented");
    }
    detectCollision(enemy: GameEnemy): boolean {
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

    private swingLight: PointLight = new PointLight(0xffff00, 0.4, 100);

    static TWO_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6 * 2);

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.modelMesh = mesh;
        this.group.add(this.modelMesh);
        this.group.add(this.swingLight);
        this.modelMesh.scale.set(1.5, 1.5, 1.5);
        this.modelMesh.position.z = -30;
        this.modelMesh.rotation.y = -Math.PI / 2;
    }

    update(dt: number, elapsed: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 20, felixPos.y);
        this.swingLight.position.copy(this.modelMesh.position);
        this.swingLight.position.y = 30;

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

    static ONE_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6)
            .multiplyScalar(5);

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