'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { addNumbers } from '@/lib/calculator';

type FormError = {
  field: 'first' | 'second' | 'both';
  message: string;
};

export function CalculatorForm() {
  const [firstNumber, setFirstNumber] = useState('');
  const [secondNumber, setSecondNumber] = useState('');
  const [sum, setSum] = useState<string | null>(null);
  const [error, setError] = useState<FormError | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const outcome = addNumbers(firstNumber, secondNumber);

    if (!outcome.ok) {
      setSum(null);
      setError(outcome);
      return;
    }

    setError(null);
    setSum(outcome.sum);
  }

  function updateNumber(field: 'first' | 'second', value: string) {
    if (field === 'first') {
      setFirstNumber(value);
    } else {
      setSecondNumber(value);
    }

    setError(null);
    setSum(null);
  }

  const firstInvalid = error?.field === 'first' || error?.field === 'both';
  const secondInvalid = error?.field === 'second' || error?.field === 'both';

  return (
    <section className="calculator" aria-labelledby="calculator-title">
      <header className="calculator-header">
        <p className="eyebrow">Quick arithmetic</p>
        <h1 id="calculator-title">Add two numbers.</h1>
        <p className="intro-copy">A little space to work out your next sum.</p>
      </header>

      <form className="addition-form" onSubmit={handleSubmit} noValidate>
        <div className="number-fields">
          <div className="number-field">
            <label htmlFor="first-number">First number</label>
            <input
              id="first-number"
              name="firstNumber"
              type="number"
              inputMode="decimal"
              step="any"
              value={firstNumber}
              onChange={(event) => updateNumber('first', event.target.value)}
              aria-invalid={firstInvalid}
              aria-describedby={firstInvalid ? 'addition-error' : undefined}
              required
            />
          </div>

          <span className="operator" aria-hidden="true">
            +
          </span>

          <div className="number-field">
            <label htmlFor="second-number">Second number</label>
            <input
              id="second-number"
              name="secondNumber"
              type="number"
              inputMode="decimal"
              step="any"
              value={secondNumber}
              onChange={(event) => updateNumber('second', event.target.value)}
              aria-invalid={secondInvalid}
              aria-describedby={secondInvalid ? 'addition-error' : undefined}
              required
            />
          </div>
        </div>

        {error && (
          <p className="form-error" id="addition-error" role="alert">
            {error.message}
          </p>
        )}

        <button className="add-button" type="submit">
          Add numbers
        </button>
      </form>

      <div className="answer-panel">
        <p className="answer-label">Your sum</p>
        {sum === null ? (
          <output className="answer-value answer-placeholder" aria-live="polite">
            Your answer will appear here.
          </output>
        ) : (
          <>
            <p className="answer-equation">
              {firstNumber} <span>+</span> {secondNumber} <span>=</span>
            </p>
            <output className="answer-value" aria-live="polite" aria-atomic="true">
              {sum}
            </output>
          </>
        )}
      </div>

      <p className="privacy-note">Your numbers stay on this page and are not saved.</p>
    </section>
  );
}
