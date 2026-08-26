"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "ready" | "countdown" | "playing" | "gameover";
type Enemy = { id: number; lane: number; y: number; kind: "sedan" | "truck" | "cone" };

const LANES = [18, 38.5, 59, 79.5];
const HIGH_SCORE_KEY = "neon-apex-high-score";

function Car({ enemy = false, kind = "sedan" }: { enemy?: boolean; kind?: Enemy["kind"] }) {
  if (kind === "cone") return <span className="road-cone" aria-label="road cone" />;
  return (
    <span className={`car ${enemy ? "car--enemy" : "car--player"} car--${kind}`} aria-hidden="true">
      <i className="car__window" /><i className="car__light car__light--left" /><i className="car__light car__light--right" />
      <b className="car__wheel car__wheel--left" /><b className="car__wheel car__wheel--right" />
    </span>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState("3");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(72);
  const [lane, setLane] = useState(1);
  const [muted, setMuted] = useState(false);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [roadOffset, setRoadOffset] = useState(0);
  const laneRef = useRef(lane);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const spawnRef = useRef(0);
  const scoreRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);

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

  const endGame = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const finalScore = Math.floor(scoreRef.current);
    setScore(finalScore);
    setHighScore((current) => {
      const next = Math.max(current, finalScore);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
      return next;
    });
    setPhase("gameover");
    beep(110, 0.3);
  }, [beep]);

  const move = useCallback((direction: number) => {
    if (phase !== "playing") return;
    const next = Math.max(0, Math.min(LANES.length - 1, laneRef.current + direction));
    if (next !== laneRef.current) {
      laneRef.current = next;
      setLane(next);
      beep(440, 0.045);
    }
  }, [beep, phase]);

  const startGame = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    laneRef.current = 1;
    scoreRef.current = 0;
    lastRef.current = 0;
    spawnRef.current = 0;
    setLane(1); setScore(0); setSpeed(72); setEnemies([]); setCountdown("3"); setPhase("countdown");
    beep(330);
    let tick = 0;
    const countdownTimer = window.setInterval(() => {
      tick += 1;
      if (tick === 1) { setCountdown("2"); beep(392); }
      else if (tick === 2) { setCountdown("1"); beep(494); }
      else { window.clearInterval(countdownTimer); setCountdown("GO!"); setPhase("playing"); beep(659, 0.16); }
    }, 720);
  }, [beep]);

  useEffect(() => {
    if (phase !== "playing") return;
    const loop = (time: number) => {
      const delta = Math.min((time - (lastRef.current || time)) / 1000, 0.05);
      lastRef.current = time;
      scoreRef.current += delta * 12;
      const nextScore = Math.floor(scoreRef.current);
      setScore(nextScore);
      setSpeed(Math.min(168, 72 + Math.floor(nextScore / 80) * 5));
      setRoadOffset((current) => (current + delta * (72 + Math.floor(nextScore / 80) * 5) * 0.7) % 100);
      spawnRef.current += delta;
      const spawnEvery = Math.max(0.48, 1.05 - nextScore / 1800);
      if (spawnRef.current > spawnEvery) {
        spawnRef.current = 0;
        const nextLane = Math.floor(Math.random() * LANES.length);
        const kinds: Enemy["kind"][] = ["sedan", "sedan", "truck", "cone"];
        setEnemies((items) => [...items, { id: idRef.current++, lane: nextLane, y: -15, kind: kinds[Math.floor(Math.random() * kinds.length)] }]);
      }
      setEnemies((items) => {
        const next = items.map((item) => ({ ...item, y: item.y + delta * (13 + speed / 9) })).filter((item) => item.y < 112);
        const hit = next.some((item) => item.lane === laneRef.current && item.y > 73 && item.y < 91);
        if (hit) { endGame(); return items; }
        return next;
      });
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); frameRef.current = null; };
  }, [endGame, phase, speed]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) { event.preventDefault(); move(-1); }
      if (["ArrowRight", "d", "D"].includes(event.key)) { event.preventDefault(); move(1); }
      if (event.key === "Enter" && (phase === "ready" || phase === "gameover")) startGame();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move, phase, startGame]);

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand"><span className="brand__mark">✦</span><span>NEON<span className="brand__accent">APEX</span></span></div>
        <button className="sound-button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute sound" : "Mute sound"} aria-pressed={muted}><span>{muted ? "⌁" : "◖"}</span> {muted ? "SOUND OFF" : "SOUND ON"}</button>
      </header>

      <section className="game-layout" aria-label="Neon Apex racing game">
        <aside className="intro-panel">
          <p className="eyebrow">NIGHT RUN // 001</p>
          <h1>Own the<br /><em>night.</em></h1>
          <p className="intro-copy">Thread the traffic. Chase the horizon. How long can you keep your line?</p>
          <div className="stat-row"><span>BEST RUN</span><strong>{String(highScore).padStart(5, "0")}</strong></div>
          <p className="intro-hint"><kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd> to steer</p>
        </aside>

        <section className="game-card" aria-label="Race track">
          <div className="game-card__top"><span><i className="live-dot" /> LIVE CIRCUIT</span><span>SECTOR 01 / 03</span></div>
          <div className="track" style={{ "--road-offset": `${roadOffset}%` } as React.CSSProperties}>
            <div className="skyline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="road-lights road-lights--left" /><div className="road-lights road-lights--right" />
            <div className="road">
              <div className="lane-lines" />
              {enemies.map((enemy) => <span className="enemy-wrap" key={enemy.id} style={{ left: `${LANES[enemy.lane]}%`, top: `${enemy.y}%` }}><Car enemy kind={enemy.kind} /></span>)}
              <span className="player-wrap" style={{ left: `${LANES[lane]}%` }}><Car /></span>
              <div className="speed-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            </div>
            {phase === "countdown" && <div className="countdown" aria-live="assertive"><span>{countdown}</span><small>GET READY</small></div>}
            {phase === "ready" && <div className="overlay"><div className="overlay__icon">✦</div><p className="eyebrow">WELCOME TO THE</p><h2>NEON APEX</h2><p>THE CITY NEVER SLEEPS.</p><button className="primary-button" onClick={startGame}>PLAY GAME <span>→</span></button></div>}
            {phase === "gameover" && <div className="overlay overlay--gameover"><p className="eyebrow">RUN TERMINATED</p><h2>WRECKED.</h2><p>THE NIGHT WON THIS TIME.</p><div className="final-score"><span>FINAL SCORE</span><strong>{String(score).padStart(5, "0")}</strong></div><button className="primary-button" onClick={startGame}>PLAY AGAIN <span>↻</span></button></div>}
          </div>
          <div className="hud"><div><span>SCORE</span><strong>{String(score).padStart(5, "0")}</strong></div><div><span>SPEED <small>KM/H</small></span><strong>{speed}</strong></div><div><span>HIGH SCORE</span><strong>{String(highScore).padStart(5, "0")}</strong></div></div>
        </section>
      </section>
      <footer className="footer"><span>© 2024 NEON APEX</span><span>KEEP YOUR EYES ON THE ROAD <b>•</b> <i>GOOD LUCK, DRIVER</i></span></footer>
      {phase === "playing" && <nav className="touch-controls" aria-label="Touch steering controls"><button onClick={() => move(-1)} aria-label="Move left">←</button><button onClick={() => move(1)} aria-label="Move right">→</button></nav>}
    </main>
  );
}
