export type Era = "stoneage" | "ancient" | "industrial" | "prohibition";

import { MathUtils } from "three";
import tubaGuyUrl from "../../assets/tuba_man.png";
import bottleUrl from "../../assets/wine_bottle.png";
import steggodogUrl from "../../assets/steggodog.png";
import soldierUrl from "../../assets/roman_soldier.png";
import mammothUrl from "../../assets/mammoth.png";
import sweepUrl from "../../assets/chimney_sweep.png";
import flapperUrl from "../../assets/flapper_cat.png";
import smokeStackUrl from "../../assets/smoke_stack.png";
import tRexUrl from "../../assets/t_rex.png";
import caveCatUrl from "../../assets/cave_cat.png";
import ostrichUrl from "../../assets/ostrich.png";
import ratsUrl from "../../assets/rats.png";
import steamEngineUrl from "../../assets/steam_engine.png";
import troubleClefUrl from "../../assets/treble_clef.png";
import vikingCatUrl from "../../assets/viking_cat.png";
import warElephant from "../../assets/war_elephant.png";

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
    speed?: number;
    reverseFlip?: boolean;
    hitboxPaddingX?: number;
    hitboxPaddingY?: number;
    increasedRarity?: number;
};

// The plan is to give every enemy of the same type ONE texture.
// It will render that texture with a shadermaterial, which has a uniform of flipped
// and reverse map the texture if 1.

export const ENEMIES: DrawnEnemyConfig[] = [
    // Steggodog's come for your throat, fast, but are easy to kill.
    // Usually one bullet hit.
    // But sometimes it takes two ... keep running.
    {
        name: "Steggodog",
        textureUrl: steggodogUrl,
        width: 25,
        height: 25 * 0.45,
        frameAmount: 3,
        era: "stoneage",
        reverseFlip: true,
        animationSpeed: 50,
        health: 7,
        speed: 1.5
    },
    // A T-Rex is sturdy, strong, and also fast.
    // These won't make you actively run away like Steggodogs, but you will be on your toes.
    // They go down in two or three hits of bullet.
    // If they catch you, they will take a pretty good bite out of you.
    {
        name: "T-Rex",
        textureUrl: tRexUrl,
        width: 50 * 1.4,
        height: 50,
        frameAmount: 4,
        era: "stoneage",
        reverseFlip: true,
        animationSpeed: 1000,
        health: 25,
        speed: 3
    },
    // Slow, hulking. Get anywhere near and you will feel pain.
    // Todo: add particle effect to describe mammoths stepping range.
    // But it's easy to not get near.
    // These will stay on the clock for a while, and are worth killing sooner.
    // But you'll have to hit them 5 or 6 times.
    {
        name: "Mammoth",
        textureUrl: mammothUrl,
        width: 80,
        height: 80 * 0.93,
        frameAmount: 4,
        era: "stoneage",
        reverseFlip: true,
        animationSpeed: 1000,
        health: 50,
        speed: 7,
        increasedRarity: 0.4,
        hitboxPaddingY: -10
    },
    // Lots of these ...
    {
        name: "Cave Cat",
        textureUrl: caveCatUrl,
        width: 25,
        height: 25,
        frameAmount: 6,
        era: "stoneage",
        reverseFlip: false,
        animationSpeed: 1000,
        health: 15,
        speed: 3
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
        health: 25,
        speed: 3
    },
    {
        name: "Ostrich",
        textureUrl: ostrichUrl,
        width: 40 * 0.762,
        height: 40,
        frameAmount: 4,
        era: "ancient",
        reverseFlip: true,
        animationSpeed: 1000,
        health: 30,
        speed: 2,
        increasedRarity: 0.1
    },
    {
        name: "Viking Cat",
        textureUrl: vikingCatUrl,
        width: 25 * 0.75,
        height: 25,
        frameAmount: 6,
        era: "ancient",
        reverseFlip: false,
        animationSpeed: 500,
        health: 20,
        speed: 2.5
    },
    {
        name: "War Elephant",
        textureUrl: warElephant,
        width: 60 * 1.26,
        height: 60,
        frameAmount: 4,
        era: "ancient",
        reverseFlip: true,
        animationSpeed: 500,
        health: 55,
        speed: 5,
        increasedRarity: 0.4,
        hitboxPaddingY: -15
    },
    {
        name: "Chimney Sweep",
        textureUrl: sweepUrl,
        width: 16,
        height: 16,
        frameAmount: 6,
        era: "industrial",
        animationSpeed: 100,
        health: 30,
        speed: 2,
    },
    {
        name: "Smoke Stack",
        textureUrl: smokeStackUrl,
        width: 60 * 1.5,
        height: 60,
        frameAmount: 3,
        era: "industrial",
        animationSpeed: 50,
        health: 80,
        speed: 3.5,
        reverseFlip: true
    },
    {
        name: "Rats",
        textureUrl: ratsUrl,
        width: 15 * 1.332,
        height: 15,
        frameAmount: 2,
        era: "industrial",
        animationSpeed: 100,
        health: 20,
        speed: 2,
    },
    {
        name: "Steam Engine",
        textureUrl: steamEngineUrl,
        width: 30 * 2.245,
        height: 30,
        frameAmount: 3,
        era: "industrial",
        animationSpeed: 50,
        health: 100,
        speed: 5,
        reverseFlip: true
    },
    {
        name: "Flapper",
        textureUrl: flapperUrl,
        width: 32 * 0.67,
        height: 32,
        frameAmount: 4,
        era: "prohibition",
        animationSpeed: 500,
        health: 60,
        speed: 2,
        reverseFlip: true
    },
    {
        name: "Tuba Guy",
        textureUrl: tubaGuyUrl,
        width: 32 * 0.878571429,
        height: 32,
        frameAmount: 4,
        era: "prohibition",
        animationSpeed: 500,
        health: 120,
        speed: 4,
        hitboxPaddingX: 0,
        hitboxPaddingY: 2,
    },
    {
        name: "Wine Bottle",
        textureUrl: bottleUrl,
        width: 20 * 0.3125,
        height: 20,
        frameAmount: 5,
        era: "prohibition",
        animationSpeed: 200,
        health: 15,
        speed: 2.5
    },
    {
        name: "Trouble Clef",
        textureUrl: troubleClefUrl,
        width: 40 * 0.49,
        height: 40,
        frameAmount: 3,
        era: "prohibition",
        animationSpeed: 750,
        reverseFlip: true,
        health: 100,
        speed: 3.5
    }
];

export const getEnemyByName = (name: string) => {
    const e = ENEMIES.find(e => e.name === name);
    if (!e) throw new Error(`Unknown enemy: ${name}`);
    return e;
};

export const getRandomEnemyName = (coll = ENEMIES) => {
    const rand = MathUtils.randInt(0, coll.length - 1);
    return coll[rand].name;
};

const eraCache: { [key: string]: DrawnEnemyConfig[] } = {};
eraCache["stoneage"] = ENEMIES.filter(e => e.era === "stoneage");
eraCache["ancient"] = ENEMIES.filter(e => e.era === "ancient");
eraCache["industrial"] = ENEMIES.filter(e => e.era === "industrial");
eraCache["prohibition"] = ENEMIES.filter(e => e.era === "prohibition");

export const getRandomEnemyFromEra = (era: string) => {
    const coll = eraCache[era];
    if (!coll) throw new Error("Unknown era " + era);
    return getRandomEnemyName(coll);
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