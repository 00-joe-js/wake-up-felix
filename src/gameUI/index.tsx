import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import felixFacesUrl from "../../assets/felix-faces.png";
import Upgrade from "./Upgrade";
import MenuScreens from "./MenuScreens";
import Victory from "./Victory";

export type UpgradeSelectionFn = (
  choseWeapon: boolean,
  upgradeId: string | null,
  scalar: number
) => any;

export type BagXp = {
  minute: number;
  total: number;
};

export type GameState = {
  elapsedTime: number;
  felixHP: number;
  felixMaxHP: number;
  gameStarted: boolean;
  totalXp: number;
  currentXp: number;
  bagXps: BagXp[];
  chosenWeapons: number[];
  onUpgradeScreen: number | null;
  upgradeSelectionFn: UpgradeSelectionFn | null;
  expectedMinuteXp: number | null;
  paused: boolean;
  startGame: Function | null;
  eraMessage: string;
  victorious: boolean;
  gameOver: boolean;
};

export type UIMethods = {
  setTime: (ms: number, f?: boolean) => void;
  setFelixHP: (newHP: number) => void;
  increaseFelixMaxHP: () => void;
  addXP: (a: number) => void;
  replaceCurrentXP: (t: number) => void;
  getGameState: () => GameState;
  showUpgradeScreen: (n: number, xpE: number, fn: UpgradeSelectionFn) => void;
  hideUpgradeScreen: () => void;
  storeCurrentXPInBag: (n: number) => void;
  addChosenWeapon: (m: number) => void;
  showPauseScreen: () => void;
  hidePauseScreen: () => void;
  provideStartGame: (f: Function) => void;
  startEndingSequence: () => void;
  setEraMessage: (s: string) => void;
  showVictoryScreen: () => void;
  setGameOver: () => void;
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
  const faceClasses = ["mad-hurt", "uh-oh", "angry", "feeling-good"];

  if (totalHP === 5) {
    // Todo: replace with Roman.
    faceClasses.push("war");
  }

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

const Timer = ({
  time,
  currentEraLabel,
}: {
  time: number;
  currentEraLabel: string;
}) => {
  const eraMessageRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (currentEraLabel === "") return;
    let start = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - start;
      if (eraMessageRef.current) {
        const r = (Math.sin(elapsed / 100) + 1) / 2;
        eraMessageRef.current.style.opacity = (r / 2).toString();
        if (elapsed > 4000 && r > 0.7) {
          clearInterval(i);
          eraMessageRef.current.style.opacity = "1";
        }
      }
    });
    return () => clearInterval(i);
  }, [currentEraLabel]);

  return (
    <div id="time-display">
      <h1>{time !== Infinity ? formatTime(time) : "???"}</h1>
      <span className="game-era-message" ref={eraMessageRef}>
        {currentEraLabel}
      </span>
    </div>
  );
};

const GemCount = ({ currentGemTotal }: { currentGemTotal: number }) => {
  return (
    <div id="gem-total">
      <h1>Time Rings: {currentGemTotal}</h1>
    </div>
  );
};

const PauseScreen = () => {
  return (
    <div id="pause">
      <div>
        <h1>PAUSED</h1>
        <h4>
          Press <strong>Escape</strong> to resume
        </h4>
      </div>
    </div>
  );
};

const GameOver = () => {
  return (
    <div id="game-over-screen">
      <h1>C'mon, Felix ... wake up!</h1>
      <button
        className="back-to-main-menu"
        onClick={() => window.location.reload()}
      >
        Back To Main Menu
      </button>
    </div>
  );
};

const UI = ({ gameState }: { gameState: GameState }) => {
  const onUpgradeScreen = gameState.onUpgradeScreen;
  const onSelect = gameState.upgradeSelectionFn;
  return (
    <div id="game-ui-content">
      {gameState.victorious && <Victory gameState={gameState} />}
      {gameState.gameOver && <GameOver />}
      {gameState.paused && <PauseScreen />}
      {onUpgradeScreen && onSelect && (
        <Upgrade gameState={gameState} onSelect={onSelect} />
      )}
      <Timer
        time={gameState.elapsedTime}
        currentEraLabel={gameState.eraMessage}
      />
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
    gameStarted: false,
    totalXp: 999,
    currentXp: 0,
    expectedMinuteXp: null,
    bagXps: [],
    chosenWeapons: [],
    onUpgradeScreen: null,
    upgradeSelectionFn: null,
    paused: false,
    startGame: null,
    eraMessage: "",
    victorious: false,
    gameOver: false,
  };

  const uiContainer = window.getDOMOne("#game-ui");

  const root = createRoot(uiContainer);

  let stateDirty = true;

  const renderLoop = () => {
    if (gameState.gameStarted === false) {
      root.render(
        <MenuScreens
          onStartGame={() => {
            if (gameState.startGame) {
              gameState.startGame();
              gameState.gameStarted = true;
              window.requestAnimationFrame(renderLoop);
            }
          }}
        />
      );
    } else {
      if (stateDirty) {
        stateDirty = false;
        root.render(<UI gameState={gameState} />);
      }
      window.requestAnimationFrame(renderLoop);
    }
  };
  window.requestAnimationFrame(renderLoop);

  const setStateDirty = () => {
    stateDirty = true;
  };

  let lastKnownSecond = 0;

  return {
    setTime(elapsedMs, forceDirtyState: boolean = false) {
      gameState.elapsedTime = elapsedMs;
      const second = Math.floor(elapsedMs / 1000);
      if (forceDirtyState || second > lastKnownSecond) {
        lastKnownSecond = second;
        setStateDirty();
      }
    },
    setFelixHP(newHP) {
      gameState.felixHP = newHP;
      setStateDirty();
    },
    increaseFelixMaxHP() {
      gameState.felixMaxHP = 5;
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
    showUpgradeScreen(
      minute: number,
      expectedXp: number,
      onSelection: UpgradeSelectionFn
    ) {
      gameState.onUpgradeScreen = minute;
      gameState.upgradeSelectionFn = onSelection;
      gameState.expectedMinuteXp = expectedXp;
      setStateDirty();
    },
    hideUpgradeScreen() {
      gameState.onUpgradeScreen = null;
      gameState.upgradeSelectionFn = null;
      setStateDirty();
    },
    addChosenWeapon(minute: number) {
      gameState.chosenWeapons.push(minute);
      setStateDirty();
    },
    showPauseScreen() {
      gameState.paused = true;
      setStateDirty();
    },
    hidePauseScreen() {
      gameState.paused = false;
      setStateDirty();
    },
    provideStartGame(f) {
      gameState.startGame = f;
    },
    startEndingSequence() {
      gameState.elapsedTime = Infinity;
      gameState.eraMessage = "???";
      setStateDirty();
    },
    setEraMessage(s: string) {
      gameState.eraMessage = s;
      setStateDirty();
    },
    showVictoryScreen() {
      gameState.victorious = true;
      setStateDirty();
    },
    setGameOver() {
      gameState.gameOver = true;
      setStateDirty();
    },
  };
};
