'use client';

import { FormEvent, useState } from 'react';

type FormValues = {
  first: string;
  second: string;
};

const initialValues: FormValues = {
  first: '',
  second: '',
};

export default function AdditionCalculator() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const first = Number(values.first);
    const second = Number(values.second);
    const hasMissingValue = values.first.trim() === '' || values.second.trim() === '';

    if (hasMissingValue || !Number.isFinite(first) || !Number.isFinite(second)) {
      setResult(null);
      setError('Enter two valid numbers to see the sum.');
      return;
    }

    setError(null);
    setResult(first + second);
  }

  function handleClear() {
    setValues(initialValues);
    setResult(null);
    setError(null);
  }

  const formattedResult =
    result === null
      ? null
      : new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 10,
        }).format(result);

  return (
    <section
      aria-labelledby="calculator-title"
      className="border-line bg-surface w-full max-w-[30rem] rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(72,56,39,0.12)] sm:p-10"
    >
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-accent-dark mb-3 text-xs font-bold tracking-[0.2em] uppercase">
            Everyday arithmetic
          </p>
          <h1
            id="calculator-title"
            className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl"
          >
            Add it up.
          </h1>
        </div>
        <span
          aria-hidden="true"
          className="bg-accent-soft text-accent-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-medium"
        >
          +
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <label className="grid gap-2" htmlFor="first-number">
            <span className="text-muted-ink text-sm font-medium">First number</span>
            <input
              id="first-number"
              name="first-number"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.first}
              onChange={(event) => handleChange('first', event.target.value)}
              aria-describedby={error ? 'calculator-error' : undefined}
              className="border-line bg-canvas text-ink placeholder:text-muted-ink/50 focus:border-accent focus:ring-accent-soft h-16 w-full rounded-2xl border px-4 text-2xl font-medium tracking-[-0.04em] transition outline-none focus:ring-4"
              placeholder="0"
            />
          </label>

          <span
            aria-hidden="true"
            className="text-muted-ink hidden pb-4 text-center text-3xl font-light sm:block"
          >
            +
          </span>

          <label className="grid gap-2" htmlFor="second-number">
            <span className="text-muted-ink text-sm font-medium">Second number</span>
            <input
              id="second-number"
              name="second-number"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.second}
              onChange={(event) => handleChange('second', event.target.value)}
              aria-describedby={error ? 'calculator-error' : undefined}
              className="border-line bg-canvas text-ink placeholder:text-muted-ink/50 focus:border-accent focus:ring-accent-soft h-16 w-full rounded-2xl border px-4 text-2xl font-medium tracking-[-0.04em] transition outline-none focus:ring-4"
              placeholder="0"
            />
          </label>
        </div>

        {error ? (
          <p
            id="calculator-error"
            role="alert"
            className="text-accent-dark mt-4 text-sm font-medium"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="submit"
            className="bg-accent hover:bg-accent-dark focus:ring-accent-soft min-h-14 rounded-2xl px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(237,107,90,0.22)] transition focus:ring-4 focus:outline-none active:translate-y-px"
          >
            Calculate sum
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="border-line text-muted-ink hover:border-ink hover:text-ink focus:ring-accent-soft min-h-14 rounded-2xl border px-5 text-base font-semibold transition focus:ring-4 focus:outline-none"
          >
            Clear
          </button>
        </div>
      </form>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="bg-ink mt-8 min-h-32 rounded-2xl px-6 py-5 text-white"
      >
        <p className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">Your answer</p>
        {formattedResult ? (
          <p className="mt-2 text-5xl font-semibold tracking-[-0.07em] sm:text-6xl">
            {formattedResult}
          </p>
        ) : (
          <p className="mt-2 text-lg text-white/60">The sum will appear here.</p>
        )}
      </div>
    </section>
  );
}
