import React, { useEffect, useMemo, useRef, useState } from "react";

import fatherTimeContent from "../../assets/father_time_content.png";
import fatherTimeLaugh from "../../assets/father_time_laughter.png";
import fatherTimeUpset from "../../assets/father_time_upset.png";
import fatherTimeRage from "../../assets/father_time_rage.png";

import {
  fatherAngry,
  fatherHappy,
  fatherContent,
  fatherIrritated,
} from "../Audio";

import { GameState, UpgradeSelectionFn } from ".";
import upgrades from "../Baggie/upgrades";
import weaponDescriptions, { WeaponDescription } from "./weaponDescriptions";
import shuffleArray from "shuffle-array";

import { submitScoreToLeaderboard } from "../LootLocker";

const Upgrade = ({
  gameState,
  onSelect,
}: {
  gameState: GameState;
  onSelect: UpgradeSelectionFn;
}) => {
  const { onUpgradeScreen: minute, bagXps, expectedMinuteXp } = gameState;

  const threeRandomUpgrades = useMemo(() => {
    return shuffleArray(upgrades.slice(0)).slice(0, 3);
  }, [minute]);

  const container = useRef<HTMLDivElement>(null);
  const [selectionMade, setSelectionMade] = useState(false);

  useEffect(() => {
    if (selectionMade && container.current) {
      const el = container.current;
      const i = setInterval(() => {
        el.style.opacity = `${parseFloat(el.style.opacity) - 0.05}`;
      }, 10);
      return () => clearInterval(i);
    }
  }, [selectionMade]);

  const weaponDescription: WeaponDescription | null = useMemo(() => {
    if (!minute) return null;
    const d = weaponDescriptions[minute];
    if (!d) throw new Error(`No weapon details for minute ${minute}`);
    return d;
  }, [minute]);

  const xpForThisBag = useMemo(() => {
    if (!minute) return null;
    const bag = bagXps.find((b) => b.minute === minute);
    if (!bag) {
      throw new Error("No bagged XP for this minute upgrade.");
    }
    return bag.total;
  }, [minute, bagXps]);

  const [opacity, setOpacity] = useState<number>(0);
  useEffect(() => {
    if (opacity < 1) {
      setTimeout(() => setOpacity(opacity + 0.1), 20);
    }
  }, [opacity]);

  useEffect(() => {
    if (minute && xpForThisBag && expectedMinuteXp) {
      submitScoreToLeaderboard(xpForThisBag, shuffleArray(
        [
          "I, X, XI",
          "II, III, V",
          "IV, V, VI",
          "VI, VIII, XI",
          "I, II, III",
          "II, VII, IX"
        ]
      )[0]);
      const scalar = xpForThisBag / expectedMinuteXp;
      if (scalar >= 1) {
        if (scalar >= 2) {
          fatherHappy.play();
        } else {
          fatherContent.play();
        }
      } else {
        if (scalar < 0.5) {
          fatherAngry.play();
        } else {
          fatherIrritated.play();
        }
      }
    }
  }, [minute, xpForThisBag, expectedMinuteXp]);

  if (expectedMinuteXp === null) {
    throw new Error("Should not render without expectedMinuteXp.");
  }

  if (!weaponDescription || typeof xpForThisBag !== "number") return null;

  const scalar = xpForThisBag / expectedMinuteXp;
  const perc = (scalar * 100).toFixed(0) + "%";
  const extraBonusClass = scalar >= 1 ? "good" : "bad";
  const punc = extraBonusClass === "good" ? "!" : " ...";

  const fatherTimeUrl = (() => {
    if (scalar >= 1) {
      if (scalar >= 2) {
        return fatherTimeLaugh;
      } else {
        return fatherTimeContent;
      }
    } else {
      if (scalar < 0.5) {
        return fatherTimeRage;
      } else {
        return fatherTimeUpset;
      }
    }
  })();

  const remainingWeaponAmount = 3 - gameState.chosenWeapons.length;

  return (
    <div id="upgrade-container" ref={container} style={{ opacity }}>
      <div className="got-the-bag">
        <h1>You got the {minute}:00 bag!</h1>
        <div className="xp-stats">
          <div className="scaling-result">
            <img className="father-time" src={fatherTimeUrl} />
            <div>
              <h3>
                XP collected during this minute: <strong>{xpForThisBag}</strong>
              </h3>
              <h3>
                XP needed by Father Time: <strong>{expectedMinuteXp}</strong>
              </h3>
              <h2>
                This weapon or upgrade will be{" "}
                <strong>{scalar.toFixed(2)}x</strong> as powerful!
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="selection-section">
        {remainingWeaponAmount !== 0 && (
          <div className="choose-weapon">
            <div className="weapon-description">
              <h3>{weaponDescription.heading}</h3>
              <p>{weaponDescription.elaborate}</p>
            </div>
            <h2
              onClick={() => {
                if (selectionMade) return;
                setSelectionMade(true);
                onSelect(true, null, scalar);
              }}
            >
              Claim <br />
              <strong>{weaponDescription.roman}</strong>
              <br /> as your weapon
              <span className={`bonus ${extraBonusClass}`}>
                {perc} damage{punc}
              </span>
            </h2>
            <h4 className="remaining-weapons">
              You can claim {remainingWeaponAmount} more{" "}
              {remainingWeaponAmount === 1 ? "weapon" : "weapons"}!
            </h4>
          </div>
        )}
        {remainingWeaponAmount === 0 && (
          <div className="choose-weapon">
            <h2>You can't claim any more weapons.</h2>
          </div>
        )}
        <div className="divider-vertical" />
        <div className="choose-upgrade">
          <h1>Or, have an upgrade ...</h1>
          {threeRandomUpgrades.map((u) => {
            return (
              <div
                className="one-upgrade"
                key={u.id}
                onClick={() => {
                  if (selectionMade) return;
                  setSelectionMade(true);
                  onSelect(false, u.id, scalar);
                }}
              >
                <h2>{u.name}</h2>
                <p>{u.description}</p>
                <span className={`bonus ${extraBonusClass}`}>
                  {u.scalarLabel(perc, scalar)}
                  {punc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
