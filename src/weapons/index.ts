import bulletUrl from "../../assets/bullet.png";

import { BoxGeometry, Group, MathUtils, Mesh, MeshBasicMaterial, Object3D, PointLight, Scene, Vector2, Vector3 } from "three";

import { shake } from "../renderer";
import SpritePlane from "../SpritePlane";
import { rotateAboutPoint, withinDistance2D } from "../utils";
import TwoDEnemy from "../enemies/2DEnemy";
import { textChangeRangeIsUnchanged } from "typescript";

export default class Weapon {
    public minDamage: number = 0;
    public maxDamage: number = 0;
    public hitDelay: number = 1000;
    public stunValue: number = 500;
    update(dt: number, pos: Vector2) {
        throw new Error("Not implemented");
    }
    detectCollision(enemy: TwoDEnemy): boolean {
        throw new Error("Not implemented");
    }
    onEnemyCollide(enemy: TwoDEnemy) {
        throw new Error("Not implemented");
    }
}

export class OGBullet extends Weapon {

    static COLLIDE_DISTANCE: number = 18;

    sprite: SpritePlane;
    mesh: Mesh;

    stunValue = 1000;

    public minDamage: number = 5;
    public maxDamage: number = 8;

    constructor() {
        super();
        const BULLET_SIZE = 30;
        const BULLET_RATIO = 101 / (664 / 3);
        this.sprite = new SpritePlane(bulletUrl, BULLET_SIZE, BULLET_SIZE * BULLET_RATIO, 5, 3);
        this.mesh = this.sprite.mesh;
    }

    update(dt: number, felixPos: Vector2) {
        const r = Math.sin(dt / 1000);
        const c = Math.cos(dt / 1000);
        this.mesh.position.x = felixPos.x + (r * 100);
        this.mesh.position.z = felixPos.y + (Math.sin(dt / 700) * 50);
        this.sprite.update(dt, c < 0, true);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        return withinDistance2D(OGBullet.COLLIDE_DISTANCE,
            this.mesh.position.x, enemy.object.position.x,
            this.mesh.position.z, enemy.object.position.z);
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
        shake(200);
    }
}

export class One extends Weapon {
    group: Group;
    modelMesh: Mesh;

    stunValue = 20;

    static ONE_DIR: Vector3 =
        new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 6)
            .multiplyScalar(5);

    private activeProjectiles: ({ mesh: Mesh, thrownTime: number })[] = [];

    private lastThrowTime: number = 0;

    private collisionLight: PointLight = new PointLight(0xfedf02, 10, 50);

    private scene: Scene;

    public minDamage: number = 3;
    public maxDamage: number = 6;

    constructor(mesh: Mesh, scene: Scene) {
        super();
        this.group = new Group();
        this.scene = scene;
        this.modelMesh = mesh;
        this.modelMesh.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.collisionLight);
    }

    update(dt: number, felixPos: Vector2) {
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
            proj.mesh.position.add(One.ONE_DIR);
            if (dt - proj.thrownTime > 5000) {
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

    stunValue = 2000;

    private swingLight: PointLight = new PointLight(0xffff00, 0.4, 100);

    public minDamage: number = 10;
    public maxDamage: number = 20;

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

    update(dt: number, felixPos: Vector2) {

        this.group.position.set(felixPos.x, 20, felixPos.y);
        this.swingLight.position.copy(this.modelMesh.position);
        this.swingLight.position.y = 30;

        this.group.rotation.y -= 0.075; // TODO: delta time!!!

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

    update(dt: number, felixPos: Vector2) {
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

    update(dt: number, felixPos: Vector2) {
        this.group.position.set(felixPos.x, 5, felixPos.y);
    }

    detectCollision(enemy: TwoDEnemy): boolean {
        const hitBoxWorldPos = this.hitboxMesh.position.clone().applyMatrix4(this.group.matrixWorld);
        return withinDistance2D(10, 
            hitBoxWorldPos.x, enemy.object.position.x,
            hitBoxWorldPos.z, enemy.object.position.z,
        );
    }

    onEnemyCollide(enemy: TwoDEnemy): void {
    }
}