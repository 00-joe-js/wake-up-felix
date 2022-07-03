import React, { useEffect, useMemo, useRef, useState } from "react";

import fatherTimeLaugh from "../../assets/father_time_laughter.png";

import {
  getLeaderboard,
  registerSession,
  LootLockerScoreRow,
} from "../LootLocker";

const L = ({ href, children }: { href: string; children: string }) => {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  );
};

const Help = ({ toMainMenu }: { toMainMenu: Function }) => {
  return (
    <div id="how-to-play">
      <h1 style={{ fontSize: "3rem" }}>How to play:</h1>
      <br />
      <h1>
        <strong>Controls</strong>: WASD to move, Escape to pause.
      </h1>
      <h3>
        Fend off enemies from eras of history while Father Time brings you back
        to the present day!
      </h3>
      <br />
      <h2>
        You start with{" "}
        <strong>your trusty bullet that attacks automatically</strong>. Move
        around to line it up and strike enemies!
      </h2>
      <br />
      <h2>
        Defeated enemies drop <strong>time rings</strong>. Father Time needs more time rings every minute to help
        you get back! <br />
        <strong>Try to always be collecting time rings!!!</strong>
      </h2>
      <br />
      <h2>
        Every minute, a number on the clock will dislodge and attack you.{" "}
        <strong>Defeat the number and claim its prize!</strong> The strength of
        your reward will be based on{" "}
        <strong>how many time rings you picked up during that minute</strong>.
      </h2>
      <br />
      <h2>
        <strong>
          Move carefully, pick up time rings always, and choose your rewards wisely.
        </strong>
      </h2>
      <h4>And stop trifling with time, Felix!</h4>
      <br />
      <button className="back-to-main-menu" onClick={() => toMainMenu()}>
        Back to Main Menu
      </button>
    </div>
  );
};

const Leaderboard = ({ toMainMenu }: { toMainMenu: Function }) => {
  const [scores, setScores] = useState<LootLockerScoreRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const scoreRows: LootLockerScoreRow[] = await getLeaderboard();
        setScores(scoreRows);
      } catch (e) {
        await registerSession();
        const scoreRows: LootLockerScoreRow[] = await getLeaderboard();
        setScores(scoreRows);
      }
    })();
  }, []);

  if (scores === null) {
    return <h1>Looading</h1>;
  }

  return (
    <div id="leaderboard-page">
      <div id="leaderboard">
        {scores.length === 0 && <h1>No scores to display ...</h1>}
        {scores.map((sc) => {
          return (
            <div className="score-row" key={sc.member_id}>
              <h1 className="score-rank">#{sc.rank}</h1>
              <h1 className="score-member">Felix the Cat #{sc.member_id}</h1>
              <h1>
                <span>Total XP:</span> {sc.score}
              </h1>
              <h1>
                <span>Weapons:</span> {sc.metadata}
              </h1>
            </div>
          );
        })}
      </div>
      <button onClick={() => toMainMenu()} className="back-to-main-menu">
        Back to Main Menu
      </button>
    </div>
  );
};

const OpeningMenus = ({ onStartGame }: { onStartGame: Function }) => {
  useEffect(() => {
    registerSession();
  }, []);

  const [currentPage, setCurrentPage] = useState("main");

  if (currentPage === "main") {
    return (
      <div id="menu-screens">
        <div id="main-menu">
          <h1>Wake Up, Felix!</h1>
          <div id="main-menu-actions">
            <h2 onClick={() => setCurrentPage("pre-start")}>Start</h2>
            <h2 onClick={() => setCurrentPage("help")}>How to Play</h2>
            <h2 onClick={() => setCurrentPage("leaderboard")}>Leaderboard</h2>
            <h2 onClick={() => setCurrentPage("about")}>About</h2>
          </div>
        </div>
        <img
          style={{ opacity: 0, width: "3px" }}
          className="father-time-help"
          src={fatherTimeLaugh}
        />
      </div>
    );
  } else if (currentPage === "about") {
    return (
      <div id="menu-screens">
        <div id="about">
          <h1>
            <strong>Wake Up, Felix!</strong>
            <br />
            made by <L href="https://joejs.itch.io/">Joe Alves</L>,{" "}
            <L href="https://gamejolt.com/@lizzabizza">Elissa Alves</L>, and
            Hunter Fastige.
          </h1>
          <div id="jam-details">
            <h3>
              Made in 2 weeks for{" "}
              <L href="https://gamejolt.com/c/togetherjam">
                Together Jam 2022.
              </L>
            </h3>
            <h3 style={{ marginBottom: "0.25rem" }}>
              Allowed properties: <strong>Felix the Cat</strong>, Xena Warrior
              Princess, Airwolf, Tremors, and Knight Rider.
            </h3>
            <h3 style={{ marginTop: "0" }}>
              Special theme: <strong>"Power in Numbers"</strong>.
            </h3>
          </div>
          <div id="credits">
            <h3>
              Felix, Father Time, and era enemies hand-drawn by Hunter Fastige.
            </h3>
            <h3 style={{ marginBottom: "0.25rem" }}>
              Music and sound by Elissa Alves, with public domain samples from:
            </h3>
            <ul style={{ paddingTop: 0 }}>
              <li>Minor Blues - Django Reinhardt</li>
              <li>Perdido Street Blues - Louis Armstrong & Sidney Bechet</li>
              <li>Shoe Shiner's Drag - Art Hodes' Chicagoans</li>
              <li>Panama Rag - Humphrey Lyttelton</li>
              <li>Froggie Moore - Humphrey Lyttelton</li>
            </ul>
          </div>
          <button
            style={{ marginTop: "1rem" }}
            className="back-to-main-menu"
            onClick={() => setCurrentPage("main")}
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    );
  } else if (currentPage === "pre-start") {
    return (
      <div id="help-game-start">
        <div>
          <h2>
            <strong>Felix!</strong> Oh, there you go,{" "}
            <L href="https://www.youtube.com/watch?v=HSXa7LNMO6s">
              trifling with time again ...
            </L>
            <br />
            <br />
            <img className="father-time-help" src={fatherTimeLaugh} />
            <br />
            <br />
            Never gets old.
          </h2>
          <h1>
            And now you're stuck in a time dream! <br />
            You gotta fight and get back to the present!!
          </h1>
          <button id="wake-up-button" onClick={() => onStartGame()}>
            Wake Up!!!
          </button>
        </div>
        <button
          className="back-to-main-menu"
          onClick={() => {
            setCurrentPage("main");
          }}
        >
          Back to Main Menu
        </button>
      </div>
    );
  } else if (currentPage === "help") {
    return <Help toMainMenu={() => setCurrentPage("main")} />;
  } else if (currentPage === "leaderboard") {
    return <Leaderboard toMainMenu={() => setCurrentPage("main")} />;
  }

  return null;
};

export default OpeningMenus;
