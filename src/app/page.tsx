"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "ready" | "countdown" | "playing" | "gameover";
type Enemy = {
  id: number;
  lane: number;
  y: number;
  kind: "sedan" | "truck" | "cone";
};
type PlayerId = "one" | "two";
type Player = {
  id: PlayerId;
  label: string;
  lane: number;
  score: number;
  crashed: boolean;
  resetUntil: number;
};

const LANES = [18, 38.5, 59, 79.5];
const TARGET_SCORE = 700;
const BASE_SCORE_RATE = 10;
const SPEED_SCORE_RATE = 0.08;
const COLLISION_PENALTY = 100;
const NEAR_MISS_BONUS = 25;
const OVERTAKE_BONUS = 40;
const HIGH_SCORE_KEY = "neon-apex-high-score";
const INITIAL_PLAYERS: Player[] = [
  { id: "one", label: "PLAYER 1", lane: 0, score: 0, crashed: false, resetUntil: 0 },
  { id: "two", label: "PLAYER 2", lane: 3, score: 0, crashed: false, resetUntil: 0 },
];

function Car({ enemy = false, kind = "sedan", player = "one" }: { enemy?: boolean; kind?: Enemy["kind"]; player?: PlayerId }) {
  if (kind === "cone") {
    return <span className="road-cone" aria-label="road cone" />;
  }

  return (
    <span className={`car ${enemy ? "car--enemy" : `car--player car--player-${player}`} car--${kind}`} aria-hidden="true">
      <i className="car__window" />
      <i className="car__light car__light--left" />
      <i className="car__light car__light--right" />
      <b className="car__wheel car__wheel--left" />
      <b className="car__wheel car__wheel--right" />
    </span>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState("3");
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [roadOffset, setRoadOffset] = useState(0);
  const [winner, setWinner] = useState<PlayerId | null>(null);
  const playersRef = useRef(players);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const spawnRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);
  const bonusRef = useRef({ nearMiss: new Set<string>(), overtake: new Set<string>() });
  const winnerRef = useRef<PlayerId | null>(null);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    const timer = window.setTimeout(() => setHighScore(Number.isFinite(saved) ? saved : 0), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const beep = useCallback((frequency: number, duration = 0.08) => {
    if (muted || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      audioRef.current ??= new AudioCtx();
      const oscillator = audioRef.current.createOscillator();
      const gain = audioRef.current.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "square";
      gain.gain.setValueAtTime(0.035, audioRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioRef.current.currentTime + duration);
      oscillator.connect(gain).connect(audioRef.current.destination);
      oscillator.start();
      oscillator.stop(audioRef.current.currentTime + duration);
    } catch (error) {
      console.warn("Audio feedback unavailable", error);
    }
  }, [muted]);

  const endGame = useCallback((winningPlayer: PlayerId | null) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    winnerRef.current = winningPlayer;
    setWinner(winningPlayer);
    setPhase("gameover");
    setHighScore((current) => {
      const bestRun = Math.max(current, ...playersRef.current.map((player) => Math.floor(player.score)));
      window.localStorage.setItem(HIGH_SCORE_KEY, String(bestRun));
      return bestRun;
    });
    beep(winningPlayer ? 659 : 110, winningPlayer ? 0.22 : 0.3);
  }, [beep]);

  const move = useCallback((playerId: PlayerId, direction: number) => {
    if (phase !== "playing") return;

    setPlayers((current) => current.map((player) => {
      if (player.id !== playerId || player.crashed) return player;
      const nextLane = Math.max(0, Math.min(LANES.length - 1, player.lane + direction));
      if (nextLane !== player.lane) beep(playerId === "one" ? 440 : 523, 0.045);
      return { ...player, lane: nextLane };
    }));
  }, [beep, phase]);

  const startGame = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    playersRef.current = INITIAL_PLAYERS;
    winnerRef.current = null;
    lastRef.current = 0;
    spawnRef.current = 0;
    bonusRef.current = { nearMiss: new Set(), overtake: new Set() };
    setPlayers(INITIAL_PLAYERS);
    setEnemies([]);
    setWinner(null);
    setCountdown("3");
    setPhase("countdown");
    beep(330);

    let tick = 0;
    const countdownTimer = window.setInterval(() => {
      tick += 1;
      if (tick === 1) {
        setCountdown("2");
        beep(392);
      } else if (tick === 2) {
        setCountdown("1");
        beep(494);
      } else {
        window.clearInterval(countdownTimer);
        setCountdown("GO!");
        setPhase("playing");
        beep(659, 0.16);
      }
    }, 720);
  }, [beep]);

  useEffect(() => {
    if (phase !== "playing") return;

    const loop = (time: number) => {
      const delta = Math.min((time - (lastRef.current || time)) / 1000, 0.05);
      lastRef.current = time;
      const currentSpeed = Math.min(168, 72 + Math.floor(Math.max(...playersRef.current.map((player) => player.score)) / 80) * 5);
      setRoadOffset((current) => (current + delta * currentSpeed * 0.7) % 100);
      spawnRef.current += delta;

      if (spawnRef.current > Math.max(0.48, 1.05 - Math.max(...playersRef.current.map((player) => player.score)) / 1800)) {
        spawnRef.current = 0;
        const kinds: Enemy["kind"][] = ["sedan", "sedan", "truck", "cone"];
        setEnemies((items) => [
          ...items,
          {
            id: idRef.current++,
            lane: Math.floor(Math.random() * LANES.length),
            y: -15,
            kind: kinds[Math.floor(Math.random() * kinds.length)],
          },
        ]);
      }

      setEnemies((items) => {
        const next = items
          .map((item) => ({ ...item, y: item.y + delta * (13 + currentSpeed / 9) }))
          .filter((item) => item.y < 112);
        const now = performance.now();
        const collisionIds = new Set(
          next
            .filter((item) => item.y > 73 && item.y < 91)
            .map((item) => item.lane),
        );

        setPlayers((current) => {
          const updated = current.map((player) => {
            const canBeHit = player.resetUntil < now;
            const scoreRate = BASE_SCORE_RATE + Math.max(0, currentSpeed - 72) * SPEED_SCORE_RATE;
            const isNearMiss = next.some((item) => {
              const key = `${player.id}:${item.id}`;
              const avoidedByOneLane = Math.abs(item.lane - player.lane) === 1;
              const inNearMissZone = item.y > 76 && item.y < 88;
              if (avoidedByOneLane && inNearMissZone && !bonusRef.current.nearMiss.has(key)) {
                bonusRef.current.nearMiss.add(key);
                return true;
              }
              return false;
            });
            const hasOvertake = next.some((item) => {
              const key = `${player.id}:${item.id}`;
              const clearedPlayer = item.y >= 94 && item.lane !== player.lane;
              if (clearedPlayer && !bonusRef.current.overtake.has(key)) {
                bonusRef.current.overtake.add(key);
                return true;
              }
              return false;
            });
            const bonus = (isNearMiss ? NEAR_MISS_BONUS : 0) + (hasOvertake ? OVERTAKE_BONUS : 0);

            if (!canBeHit) {
              return { ...player, crashed: true };
            }

            if (!collisionIds.has(player.lane)) {
              return {
                ...player,
                crashed: false,
                score: player.score + delta * scoreRate + bonus,
              };
            }

            beep(player.id === "one" ? 150 : 190, 0.16);
            return {
              ...player,
              crashed: true,
              lane: player.id === "one" ? 0 : 3,
              score: Math.max(0, player.score - COLLISION_PENALTY),
              resetUntil: now + 1200,
            };
          });

          playersRef.current = updated;
          const reachedTarget = updated.find((player) => player.score >= TARGET_SCORE);
          if (reachedTarget && !winnerRef.current) endGame(reachedTarget.id);
          return updated;
        });

        return next;
      });

      if (!winnerRef.current) frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [beep, endGame, phase]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (["a", "A"].includes(event.key)) {
        event.preventDefault();
        move("one", -1);
      }
      if (["d", "D"].includes(event.key)) {
        event.preventDefault();
        move("one", 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move("two", -1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move("two", 1);
      }
      if (event.key === "Enter" && (phase === "ready" || phase === "gameover")) startGame();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move, phase, startGame]);

  const playerOne = players[0];
  const playerTwo = players[1];
  const winnerLabel = winner === "one" ? "PLAYER 1 WINS" : winner === "two" ? "PLAYER 2 WINS" : "NO WINNER";

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand"><span className="brand__mark">✦</span><span>NEON<span className="brand__accent">APEX</span></span></div>
        <button className="sound-button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute sound" : "Mute sound"} aria-pressed={muted}><span>{muted ? "⌁" : "◖"}</span> {muted ? "SOUND OFF" : "SOUND ON"}</button>
      </header>

      <section className="game-layout" aria-label="Neon Apex local multiplayer race">
        <aside className="intro-panel">
          <p className="eyebrow">LOCAL DUEL // 001</p>
          <h1>Own the<br /><em>night.</em></h1>
          <p className="intro-copy">Two drivers. One road. First to {TARGET_SCORE} wins. Speed, near misses, and clean overtakes build your score.</p>
          <div className="player-legend">
            <div><span className="player-dot player-dot--one" /><span>PLAYER 1</span><strong>A / D</strong></div>
            <div><span className="player-dot player-dot--two" /><span>PLAYER 2</span><strong>← / →</strong></div>
          </div>
          <div className="stat-row"><span>BEST RUN</span><strong>{String(highScore).padStart(5, "0")}</strong></div>
        </aside>

        <section className="game-card" aria-label="Race track">
          <div className="game-card__top"><span><i className="live-dot" /> TWO PLAYER CIRCUIT</span><span>FIRST TO {TARGET_SCORE}</span></div>
          <div className="track" style={{ "--road-offset": `${roadOffset}%` } as React.CSSProperties}>
            <div className="skyline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="road-lights road-lights--left" />
            <div className="road-lights road-lights--right" />
            <div className="road">
              <div className="lane-lines" />
              {enemies.map((enemy) => (
                <span className="enemy-wrap" key={enemy.id} style={{ left: `${LANES[enemy.lane]}%`, top: `${enemy.y}%` }}>
                  <Car enemy kind={enemy.kind} />
                </span>
              ))}
              <span className={`player-wrap player-wrap--one ${playerOne.crashed ? "player-wrap--crashed" : ""}`} style={{ left: `${LANES[playerOne.lane]}%` }}>
                <Car player="one" />
              </span>
              <span className={`player-wrap player-wrap--two ${playerTwo.crashed ? "player-wrap--crashed" : ""}`} style={{ left: `${LANES[playerTwo.lane]}%` }}>
                <Car player="two" />
              </span>
              <div className="speed-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            </div>
            {phase === "countdown" && <div className="countdown" aria-live="assertive"><span>{countdown}</span><small>GET READY, DRIVERS</small></div>}
            {phase === "ready" && <div className="overlay"><div className="overlay__icon">✦</div><p className="eyebrow">WELCOME TO THE</p><h2>NEON APEX</h2><p>FIRST DRIVER TO {TARGET_SCORE} WINS.</p><button className="primary-button" onClick={startGame}>START DUEL <span>→</span></button></div>}
            {phase === "gameover" && <div className="overlay overlay--gameover"><p className="eyebrow">RACE COMPLETE</p><h2>{winnerLabel}</h2><p>THE NIGHT HAS A NEW CHAMPION.</p><div className="final-score"><span>WINNING SCORE</span><strong>{String(TARGET_SCORE).padStart(5, "0")}</strong></div><button className="primary-button" onClick={startGame}>RACE AGAIN <span>↻</span></button></div>}
          </div>
          <div className="hud">
            <div className="hud-player hud-player--one"><span>PLAYER 1 <small>A / D</small></span><strong>{String(Math.floor(playerOne.score)).padStart(4, "0")}</strong></div>
            <div className="hud-target"><span>TARGET <small>+25 NEAR / +40 PASS</small></span><strong>{TARGET_SCORE}</strong></div>
            <div className="hud-player hud-player--two"><span>PLAYER 2 <small>← / →</small></span><strong>{String(Math.floor(playerTwo.score)).padStart(4, "0")}</strong></div>
          </div>
        </section>
      </section>
      <footer className="footer"><span>© 2024 NEON APEX</span><span>KEEP YOUR EYES ON THE ROAD <b>•</b> <i>GOOD LUCK, DRIVERS</i></span></footer>
      {phase === "playing" && <nav className="touch-controls" aria-label="Touch steering controls"><div><small>PLAYER 1</small><button onClick={() => move("one", -1)} aria-label="Player 1 move left">←</button><button onClick={() => move("one", 1)} aria-label="Player 1 move right">→</button></div><div><small>PLAYER 2</small><button onClick={() => move("two", -1)} aria-label="Player 2 move left">←</button><button onClick={() => move("two", 1)} aria-label="Player 2 move right">→</button></div></nav>}
    </main>
  );
}
