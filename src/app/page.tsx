'use client';

import { FormEvent, useState } from 'react';

type Problem = {
  minuend: number;
  subtrahend: number;
};

type Feedback = {
  tone: 'success' | 'error';
  message: string;
} | null;

const initialProblem: Problem = { minuend: 14, subtrahend: 6 };

function createProblem(previous: Problem): Problem {
  let nextProblem = previous;

  while (
    nextProblem.minuend === previous.minuend &&
    nextProblem.subtrahend === previous.subtrahend
  ) {
    const answer = Math.floor(Math.random() * 21);
    const subtrahend = Math.floor(Math.random() * (21 - answer));
    nextProblem = {
      minuend: answer + subtrahend,
      subtrahend,
    };
  }

  return nextProblem;
}

export default function Home() {
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedAnswer = answer.trim();
    const parsedAnswer = Number(trimmedAnswer);

    if (
      trimmedAnswer === '' ||
      !Number.isInteger(parsedAnswer) ||
      parsedAnswer < 0 ||
      parsedAnswer > 20
    ) {
      setFeedback({
        tone: 'error',
        message: 'Type a whole number from 0 to 20 to check your answer.',
      });
      return;
    }

    const isCorrect = parsedAnswer === problem.minuend - problem.subtrahend;
    setAttempts((currentAttempts) => currentAttempts + 1);

    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
      setFeedback({
        tone: 'success',
        message: 'Brilliant! You got it right.',
      });
      return;
    }

    setFeedback({
      tone: 'error',
      message: `Not quite — the answer is ${problem.minuend - problem.subtrahend}. Keep going!`,
    });
  }

  function handleNextProblem() {
    setProblem((currentProblem) => createProblem(currentProblem));
    setAnswer('');
    setFeedback(null);
  }

  function handleReset() {
    setProblem(initialProblem);
    setAnswer('');
    setScore(0);
    setAttempts(0);
    setFeedback(null);
  }

  const hasFeedback = feedback !== null;

  return (
    <main className="practice-shell">
      <div className="shape shape-sun" aria-hidden="true" />
      <div className="shape shape-coral" aria-hidden="true" />
      <div className="shape shape-blue" aria-hidden="true" />

      <section className="practice-layout" aria-labelledby="page-title">
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">
            <span>−</span>
          </div>
          <div>
            <p className="eyebrow">Little number club</p>
            <h1 id="page-title">Subtract &amp; shine</h1>
          </div>
          <button className="reset-button" type="button" onClick={handleReset}>
            Start fresh
          </button>
        </header>

        <div className="progress-row" aria-label="Practice progress">
          <div>
            <span className="progress-label">Score</span>
            <strong>
              {score} <span>/ {attempts}</span>
            </strong>
          </div>
          <p>{hasFeedback ? 'Nice work — ready for another?' : 'You’ve got this!'}</p>
        </div>

        <div className="equation-card">
          <div className="card-kicker">
            <span className="star" aria-hidden="true">
              ✦
            </span>
            Your next challenge
          </div>
          <p className="equation" aria-label={`${problem.minuend} minus ${problem.subtrahend}`}>
            <span>{problem.minuend}</span>
            <span className="operator">−</span>
            <span>{problem.subtrahend}</span>
            <span className="operator">=</span>
            <span className="question-mark" aria-hidden="true">
              ?
            </span>
          </p>

          <form className="answer-form" onSubmit={handleSubmit}>
            <label htmlFor="answer">What is the answer?</label>
            <div className="answer-row">
              <input
                id="answer"
                name="answer"
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                step="1"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (feedback?.tone === 'error') setFeedback(null);
                }}
                placeholder="0"
                aria-describedby={feedback ? 'feedback-message' : undefined}
                autoFocus
              />
              <button className="check-button" type="submit">
                Check answer <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          <div
            className={`feedback ${feedback ? `feedback-${feedback.tone}` : 'feedback-hidden'}`}
            id="feedback-message"
            role="status"
            aria-live="polite"
          >
            {feedback ? (
              <>
                <span className="feedback-icon" aria-hidden="true">
                  {feedback.tone === 'success' ? '✓' : '!'}
                </span>
                <span>{feedback.message}</span>
              </>
            ) : (
              <span>Take your best guess — mistakes help your brain grow.</span>
            )}
          </div>

          {hasFeedback && (
            <button className="next-button" type="button" onClick={handleNextProblem}>
              Next problem <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>

        <footer className="encouragement">
          <span className="heart" aria-hidden="true">
            ♥
          </span>
          Every try makes you stronger.
        </footer>
      </section>
    </main>
  );
}
