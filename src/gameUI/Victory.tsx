import React, { useEffect, useRef, useState } from "react";
import { submitScoreToLeaderboard } from "../LootLocker";

import weaponDescriptions from "./weaponDescriptions";

import { GameState } from ".";

import fatherTimeHappy from "../../assets/father_time_content.png";

import {victoryMusic} from '../Audio';

type Score = {
  member_id: string;
  metadata: string;
  player: null;
  rank: number;
  score: number;
};

const Victory = ({ gameState }: { gameState: GameState }) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [submittingScoreToLeaderboard, setSubmitting] = useState(true);
  const [leaderboardScore, setLeaderboardScore] = useState<Score | null>(null);
  const { totalXp, chosenWeapons } = gameState;

  useEffect(() => {
    if (!totalXp || !chosenWeapons) {
      throw new Error(`Game state issues, cannot submit score.`);
    }

    setSubmitting(true);
    victoryMusic.play();

    (async () => {
      const romanNumerals = chosenWeapons.map(
        (c) => weaponDescriptions[c].roman
      );
      const metadata = romanNumerals.join(", ");
      const leaderboardRow: Score = await submitScoreToLeaderboard(
        totalXp,
        metadata
      );
      setLeaderboardScore(leaderboardRow);
      setSubmitting(false);
    })();
  }, []);

  useEffect(() => {
      const i = setInterval(() => { 
        if (containerRef.current) {
          const currentOpacity = parseInt(containerRef.current.style.opacity, 10);
          containerRef.current.style.opacity = (currentOpacity + 0.05).toString();
          if (currentOpacity >= 1) {
            clearInterval(i);
          }
        }
      }, 16);
      return () => clearInterval(i);
  }, []);

  return (
    <div id="victory-screen" ref={containerRef}>
      <h1>You made it back, Felix!</h1>
      <img className="father-time" src={fatherTimeHappy} />
      {submittingScoreToLeaderboard && <h2>Submitting your score ...</h2>}
      {leaderboardScore && (
        <div id="score-and-rank">
          <h2>
            You collected <strong>{leaderboardScore.score}</strong> time rings.
          </h2>
          <h3>
            That makes you <strong>#{leaderboardScore.rank}</strong> on the
            all-time leaderboard!
          </h3>
          <h4>
            Pretty nice going choosing the {leaderboardScore.metadata} weapons;
            you understand there is power in numbers!
          </h4>
        </div>
      )}
      <button
        className="back-to-main-menu"
        onClick={() => window.location.reload()}
      >
        Return to Main Menu
      </button>
    </div>
  );
};

export default Victory;
