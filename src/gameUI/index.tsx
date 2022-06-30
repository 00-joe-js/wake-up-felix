import React from "react";
import { createRoot } from "react-dom/client";

import felixFacesUrl from "../../assets/felix-faces.png";

// todo: isolate obv
type GameState = {
  elapsedTime: number;
  felixHP: number;
  felixMaxHP: number;
  xp: number;
};

export type UIMethods = {
  setTime: (ms: number) => void;
  setFelixHP: (newHP: number) => void;
  addXP: (a: number) => void;
  replaceXPTotal: (t: number) => void;
  getGameState: () => GameState;
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
        return (
          <div
            className={`felix-face ${className}`}
            key={className}
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
  return (
    <div id="game-ui-content">
      <Timer time={gameState.elapsedTime} />
      <div id="beneath-timer">
        <HealthBar
          currentHP={gameState.felixHP}
          totalHP={gameState.felixMaxHP}
        />
        <GemCount currentGemTotal={gameState.xp} />
      </div>
    </div>
  );
};

export default (): UIMethods => {
  const gameState: GameState = {
    elapsedTime: 0,
    felixHP: 4,
    felixMaxHP: 4,
    xp: 0,
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
    replaceXPTotal(newTotal) {
      if (gameState.xp === newTotal) return;
      gameState.xp = newTotal;
      setStateDirty();
    },
    addXP(amount) {
      gameState.xp += amount;
      setStateDirty();
    },
    getGameState() {
      return gameState;
    },
  };
};
