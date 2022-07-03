
import felixHurtUrl from "../../assets/felix-ouch.wav";

import fatherHappyUrl from "../../assets/father-happy.mp3";
import fatherContentUrl from "../../assets/father-content.mp3";
import fatherIrritatedUrl from "../../assets/father-irritated.mp3";
import fatherAngryUrl from "../../assets/father-angry.mp3";

import spawnStoneAgeUrl from "../../assets/stoneage-spawn.mp3";
import spawnAncientUrl from "../../assets/ancient-spawn.mp3";
import spawnIndustrialUrl from "../../assets/industrial-spawn.mp3";
import spawnProhibitionUrl from "../../assets/prohibition-spawn.mp3";

import upgradeShowUrl from "../../assets/upgrade-show.mp3";

import gameOverUrl from "../../assets/game-over.mp3";

import xpPickupNormalUrl from "../../assets/catnip2.wav";
import xpPickupHighUrl from "../../assets/catnip1.wav";

import smallhitUrl from "../../assets/small-hit.wav";
import mediumhitUrl from "../../assets/medium-hit.wav";
import bighitUrl from "../../assets/big-hit.mp3";

// Music
import stoneageSongUrl from "../../assets/Music-stoneage.mp3";
import ancientSongUrl from "../../assets/Music-ancient.mp3";
import industrialSongUrl from "../../assets/Music-industrial.mp3";
import prohibitionSongUrl from "../../assets/Music-prohibition.mp3";
import upgradeSongUrl from "../../assets/Music-upgrade.mp3";
import finalLoopUrl from "../../assets/Music-endloop.mp3";
import musicVictoryUrl from "../../assets/Music-victory.mp3";

class AudioClip {
    private audio: HTMLAudioElement;
    public ready: boolean = false;
    private playedOnce: boolean = false;
    private backup: AudioClip | null = null;
    constructor(url: string, v: number = 1, backups: number = 0, loop: boolean = false) {
        this.audio = new Audio(url);
        this.audio.volume = v;
        this.audio.addEventListener("canplaythrough", () => {
            this.ready = true;
        });
        this.audio.loop = loop;
        if (backups > 0) {
            this.backup = new AudioClip(url, v, backups - 1);
        }
    }
    play() {
        if (this.ready) {
            if (this.playedOnce && !this.audio.ended && this.backup) {
                this.backup.play();
            } else {
                this.audio.play();
                this.playedOnce = true;
            }
        }
    }
    pause() {
        this.audio.pause();
    }
}

export const felixHurt = new AudioClip(felixHurtUrl, 0.5);

export const fatherHappy = new AudioClip(fatherHappyUrl);
export const fatherContent = new AudioClip(fatherContentUrl);
export const fatherIrritated = new AudioClip(fatherIrritatedUrl);
export const fatherAngry = new AudioClip(fatherAngryUrl);

export const spawnStoneAge = new AudioClip(spawnStoneAgeUrl);
export const spawnAncient = new AudioClip(spawnAncientUrl);
export const spawnIndustrial = new AudioClip(spawnIndustrialUrl);
export const spawnProhibition = new AudioClip(spawnProhibitionUrl);

export const upgradeShow = new AudioClip(upgradeShowUrl, 0.3);

export const xpPickupNormal = new AudioClip(xpPickupNormalUrl, 0.4, 7);
export const xpPickupHigh = new AudioClip(xpPickupHighUrl, 0.4, 5);

export const smallHit = new AudioClip(smallhitUrl, 0.2, 10);
export const mediumHit = new AudioClip(mediumhitUrl, 0.2, 3);
export const bigHit = new AudioClip(bighitUrl, 0.2, 3);

export const gameOver = new AudioClip(gameOverUrl, 0.75);

export const stoneageMusic = new AudioClip(stoneageSongUrl, 0.1, 0, true);
export const ancientMusic = new AudioClip(ancientSongUrl, 1);
export const industrialMusic = new AudioClip(industrialSongUrl, 0.5);
export const prohibitionMusic = new AudioClip(prohibitionSongUrl, 0.25);
export const upgradeLoop = new AudioClip(upgradeSongUrl, 1, 0, true);
export const finalLoop = new AudioClip(finalLoopUrl, 0.5, 0, true);
export const victoryMusic = new AudioClip(musicVictoryUrl, 0.5, 0, true);

export default AudioClip;

