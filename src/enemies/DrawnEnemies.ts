type Era = "stoneage" | "ancient" | "industrial" | "prohibition";

import { MathUtils } from "three";
import tubaGuyUrl from "../../assets/tuba_man.png";
import bottleUrl from "../../assets/wine_bottle.png";
import steggodogUrl from "../../assets/steggodog.png";
import soldierUrl from "../../assets/roman_soldier.png";
import mammothUrl from "../../assets/mammoth.png";

import TwoDEnemy from "./2DEnemy";

type DrawnEnemyConfig = {
    name: string;
    textureUrl: string;
    width: number;
    height: number;
    frameAmount: number;
    era: Era;
    health: number;
    animationSpeed: number;
    reverseFlip?: boolean;
};

export const ENEMIES: DrawnEnemyConfig[] = [
    {
        name: "Tuba Guy",
        textureUrl: tubaGuyUrl,
        width: 32 * 0.878571429,
        height: 32,
        frameAmount: 4,
        era: "prohibition",
        animationSpeed: 500,
        health: 30,
    },
    {
        name: "Wine Bottle",
        textureUrl: bottleUrl,
        width: 20 * 0.3125,
        height: 20,
        frameAmount: 5,
        era: "prohibition",
        animationSpeed: 200,
        health: 5
    },
    {
        name: "Roman Soldier",
        textureUrl: soldierUrl,
        width: 32 * 0.5,
        height: 32,
        frameAmount: 4,
        era: "ancient",
        reverseFlip: true,
        animationSpeed: 100,
        health: 14
    },
    {
        name: "Steggodog",
        textureUrl: steggodogUrl,
        width: 40,
        height: 40 * 0.45,
        frameAmount: 3,
        era: "stoneage",
        reverseFlip: true,
        animationSpeed: 50,
        health: 13
    },
    {
        name: "Mammoth",
        textureUrl: mammothUrl,
        width: 70,
        height: 70 * 0.93,
        frameAmount: 4,
        era: "stoneage",
        reverseFlip: true,
        animationSpeed: 1000,
        health: 50
    }
];

export const getRandomEnemyName = () => {
    const rand = MathUtils.randInt(0, ENEMIES.length - 1);
    return ENEMIES[rand].name;
};

export default class DrawnEnemies extends TwoDEnemy {
    constructor(enemyName: string) {
        const enemy = ENEMIES.find(e => e.name === enemyName);
        if (!enemy) {
            throw new Error(`Asking to make unknown enemy: ${enemyName}`);
        }
        super(enemy);
        if (enemy.reverseFlip === true) {
            this.setReverseFlip();
        }
    }
}