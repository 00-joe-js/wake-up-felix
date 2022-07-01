import React from "react";
import { createRoot } from "react-dom/client";

import felixFacesUrl from "../../assets/felix-faces.png";
import Upgrade from "./Upgrade";

export type UpgradeSelectionFn = (
  choseWeapon: boolean,
  upgradeId: string | null
) => any;

export type BagXp = {
  minute: number;
  total: number;
};

// todo: isolate obv
type GameState = {
  elapsedTime: number;
  felixHP: number;
  felixMaxHP: number;
  totalXp: number;
  currentXp: number;
  bagXps: BagXp[];
  chosenWeapons: number[];
  onUpgradeScreen: number | null;
  upgradeSelectionFn: UpgradeSelectionFn | null;
};

export type UIMethods = {
  setTime: (ms: number) => void;
  setFelixHP: (newHP: number) => void;
  addXP: (a: number) => void;
  replaceCurrentXP: (t: number) => void;
  getGameState: () => GameState;
  showUpgradeScreen: (n: number, fn: UpgradeSelectionFn) => void;
  hideUpgradeScreen: () => void;
  storeCurrentXPInBag: (n: number) => void;
};

const zeroPad = (s: string): string => {
  if (s.length < 2) return `0${s}`;
  return s;
};

const formatTime = (ms: number): string => {
  const wholeMinutes = Math.floor(ms / 1000 / 60);
  const remainingMs = ms - wholeMinutes * 60 * 1000;
  const seconds = Math.floor(remainingMs / 1000);

  return `${zeroPad(wholeMinutes.toString())}:${zeroPad(seconds.toString())}`;
};

const HealthBar = ({
  currentHP,
  totalHP,
}: {
  currentHP: number;
  totalHP: number;
}) => {
  const faceClasses = ["mad-hurt", "uh-oh", "anger", "feeling-good"];

  return (
    <div id="health-bar">
      {faceClasses.map((className, i) => {
        let useClass = className;
        if (currentHP - 1 > i) {
          useClass = faceClasses[currentHP - 1];
        }

        return (
          <div
            className={`felix-face ${useClass}`}
            key={i}
            style={{
              backgroundImage: `url(${felixFacesUrl})`,
              opacity: currentHP - 1 < i ? 0.1 : 1,
            }}
          />
        );
      })}
    </div>
  );
};

const Timer = ({ time }: { time: number }) => {
  return (
    <div id="time-display">
      <h1>{formatTime(time)}</h1>
    </div>
  );
};

const GemCount = ({ currentGemTotal }: { currentGemTotal: number }) => {
  return (
    <div id="gem-total">
      <h1>XP: {currentGemTotal}</h1>
    </div>
  );
};

const UI = ({ gameState }: { gameState: GameState }) => {
  const onUpgradeScreen = gameState.onUpgradeScreen;
  const onSelect = gameState.upgradeSelectionFn;
  return (
    <div id="game-ui-content">
      {onUpgradeScreen && onSelect && (
        <Upgrade
          bagXps={gameState.bagXps}
          minute={onUpgradeScreen}
          onSelect={onSelect}
        />
      )}
      <Timer time={gameState.elapsedTime} />
      <div id="beneath-timer">
        <HealthBar
          currentHP={gameState.felixHP}
          totalHP={gameState.felixMaxHP}
        />
        <GemCount currentGemTotal={gameState.currentXp} />
      </div>
    </div>
  );
};

export default (): UIMethods => {
  const gameState: GameState = {
    elapsedTime: 0,
    felixHP: 4,
    felixMaxHP: 4,
    totalXp: 0,
    currentXp: 0,
    bagXps: [{ minute: 1, total: 200 }],
    chosenWeapons: [],
    onUpgradeScreen: null,
    upgradeSelectionFn: null,
  };

  const uiContainer = window.getDOMOne("#game-ui");

  const root = createRoot(uiContainer);

  let stateDirty = true;

  const renderLoop = () => {
    if (stateDirty) {
      stateDirty = false;
      root.render(<UI gameState={gameState} />);
    }
    window.requestAnimationFrame(renderLoop);
  };
  window.requestAnimationFrame(renderLoop);

  const setStateDirty = () => {
    stateDirty = true;
  };

  let lastKnownSecond = 0;

  return {
    setTime(elapsedMs) {
      gameState.elapsedTime = elapsedMs;
      const second = Math.floor(elapsedMs / 1000);
      if (second > lastKnownSecond) {
        lastKnownSecond = second;
        setStateDirty();
      }
    },
    setFelixHP(newHP) {
      gameState.felixHP = newHP;
      setStateDirty();
    },
    replaceCurrentXP(newTotal) {
      if (gameState.currentXp === newTotal) return;
      gameState.currentXp = newTotal;
      setStateDirty();
    },
    addXP(amount) {
      gameState.currentXp += amount;
      setStateDirty();
    },
    storeCurrentXPInBag(minute) {
      gameState.bagXps.push({ minute, total: gameState.currentXp });
      gameState.currentXp = 0;
      setStateDirty();
    },
    getGameState() {
      return gameState;
    },
    showUpgradeScreen(minute: number, onSelection: UpgradeSelectionFn) {
      gameState.onUpgradeScreen = minute;
      gameState.upgradeSelectionFn = onSelection;
      setStateDirty();
    },
    hideUpgradeScreen() {
      gameState.onUpgradeScreen = null;
      gameState.upgradeSelectionFn = null;
    },
  };
};
