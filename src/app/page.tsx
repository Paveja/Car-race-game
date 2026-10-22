'use client';

import { useEffect, useMemo, useState } from 'react';

type Mark = 'X' | 'O';
type Cell = Mark | null;
type GameStatus = 'playing' | 'thinking' | 'won' | 'lost' | 'draw';

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function getWinningLine(board: Cell[]) {
  return WINNING_LINES.find(([first, second, third]) => {
    return board[first] && board[first] === board[second] && board[first] === board[third];
  });
}

function chooseComputerMove(board: Cell[]) {
  const openCells = board.flatMap((cell, index) => (cell ? [] : [index]));

  if (openCells.length === 0) {
    return null;
  }

  const preferredCells = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  return preferredCells.find((index) => !board[index]) ?? openCells[0];
}

function getStatus(board: Cell[]): { status: GameStatus; line?: readonly number[] } {
  const line = getWinningLine(board);

  if (line) {
    return {
      status: board[line[0]] === 'X' ? 'won' : 'lost',
      line,
    };
  }

  return board.every(Boolean) ? { status: 'draw' } : { status: 'playing' };
}

export default function Home() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winningLine, setWinningLine] = useState<readonly number[]>([]);

  const isRoundOver = ['won', 'lost', 'draw'].includes(status);
  const statusCopy = useMemo(() => {
    if (status === 'thinking') {
      return 'The computer is choosing a move';
    }

    if (status === 'won') {
      return 'You found the line';
    }

    if (status === 'lost') {
      return 'The computer found a line';
    }

    if (status === 'draw') {
      return 'A perfectly packed board';
    }

    return 'Your turn · place an X';
  }, [status]);

  useEffect(() => {
    if (status !== 'thinking') {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setBoard((currentBoard) => {
        const computerMove = chooseComputerMove(currentBoard);

        if (computerMove === null) {
          setStatus('draw');
          return currentBoard;
        }

        const nextBoard = [...currentBoard];
        nextBoard[computerMove] = 'O';
        const nextResult = getStatus(nextBoard);
        setWinningLine(nextResult.line ?? []);
        setStatus(nextResult.status === 'playing' ? 'playing' : nextResult.status);
        return nextBoard;
      });
    }, 480);

    return () => window.clearTimeout(timeout);
  }, [status]);

  function handleCellClick(index: number) {
    if (status !== 'playing' || board[index]) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = 'X';
    const nextResult = getStatus(nextBoard);
    setBoard(nextBoard);
    setWinningLine(nextResult.line ?? []);

    if (nextResult.status !== 'playing') {
      setStatus(nextResult.status);
      return;
    }

    setStatus('thinking');
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setStatus('playing');
    setWinningLine([]);
  }

  return (
    <main className="game-shell">
      <div className="ambient-shape ambient-shape-top" aria-hidden="true" />
      <div className="ambient-shape ambient-shape-bottom" aria-hidden="true" />

      <section className="game-layout" aria-labelledby="game-title">
        <header className="game-intro">
          <p className="eyebrow">A tiny game of focus</p>
          <h1 id="game-title">
            Tic <span>tac</span> toe
          </h1>
          <p className="intro-copy">Three in a row. No overthinking. Just one more round.</p>
        </header>

        <div className="game-card">
          <div className={`status-panel status-${status}`} aria-live="polite">
            <div>
              <p className="status-label">
                {status === 'thinking' ? 'Computer move' : 'Match status'}
              </p>
              <p className="status-message">{statusCopy}</p>
            </div>
            <div className="turn-chip" aria-label="Your mark is X">
              <span className="turn-mark">X</span>
              <span>You play X</span>
            </div>
          </div>

          <div className="board-frame">
            <div className="board" role="grid" aria-label="Tic tac toe board">
              {board.map((cell, index) => {
                const isWinningCell = winningLine.includes(index);
                const row = Math.floor(index / 3) + 1;
                const column = (index % 3) + 1;

                return (
                  <button
                    key={index}
                    type="button"
                    className={`cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${isWinningCell ? 'cell-winning' : ''}`}
                    onClick={() => handleCellClick(index)}
                    disabled={Boolean(cell) || status !== 'playing'}
                    role="gridcell"
                    aria-label={
                      cell
                        ? `Row ${row}, column ${column}: ${cell}`
                        : `Row ${row}, column ${column}: empty`
                    }
                  >
                    {cell && <span aria-hidden="true">{cell}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="game-footer">
            <div className="legend" aria-label="Player marks">
              <span className="legend-item">
                <span className="legend-mark legend-mark-x">X</span>
                You
              </span>
              <span className="legend-divider" aria-hidden="true" />
              <span className="legend-item">
                <span className="legend-mark legend-mark-o">O</span>
                Computer
              </span>
            </div>

            {isRoundOver ? (
              <button className="reset-button" type="button" onClick={resetGame}>
                Play again <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <p className="round-hint">
                {status === 'thinking' ? 'Making a move…' : 'Pick an open square'}
              </p>
            )}
          </div>
        </div>

        <footer className="page-footer">
          <span>Best of one</span>
          <span aria-hidden="true">✦</span>
          <span>Made for a quick reset</span>
        </footer>
      </section>
    </main>
  );
}
