'use client';

import { FormEvent, useState } from 'react';

const initialValues = { first: '', second: '' };

type Values = typeof initialValues;

export default function Home() {
  const [values, setValues] = useState<Values>(initialValues);
  const [result, setResult] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const firstNumber = Number(values.first);
  const secondNumber = Number(values.second);
  const firstIsValid = values.first.trim() !== '' && Number.isFinite(firstNumber);
  const secondIsValid = values.second.trim() !== '' && Number.isFinite(secondNumber);
  const canCalculate = firstIsValid && secondIsValid;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!canCalculate) {
      setResult(null);
      return;
    }

    setResult(firstNumber + secondNumber);
  }

  function handleClear() {
    setValues(initialValues);
    setResult(null);
    setSubmitted(false);
  }

  function updateValue(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setResult(null);
  }

  const expression =
    values.first || values.second ? `${values.first || '0'} + ${values.second || '0'}` : '0 + 0';

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(238,112,46,0.2),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(58,124,118,0.18),transparent_68%)] blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:gap-20">
        <header className="max-w-xl">
          <div className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(238,112,46,0.8)]" />
            Add it up
          </div>
          <h1 className="max-w-lg text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl">
            Small numbers.
            <span className="block text-[var(--accent)]">Clear answer.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-[var(--muted-foreground)]">
            A calm, quick place to bring two numbers together. No clutter, no history — just the
            result you need.
          </p>
          <div className="mt-10 flex items-center gap-4 text-sm text-[var(--subtle-foreground)]">
            <span className="font-mono text-[var(--accent)]">01</span>
            <span className="h-px w-10 bg-[var(--line)]" />
            <span>Enter two values to begin</span>
          </div>
        </header>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_24px_80px_rgba(18,18,18,0.25)] backdrop-blur sm:p-9">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-[var(--subtle-foreground)] uppercase">
                Your calculation
              </p>
              <p className="mt-2 font-mono text-sm text-[var(--muted-foreground)]">{expression}</p>
            </div>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--subtle-foreground)]">
              +
            </span>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--muted-foreground)]">
                  First number
                </span>
                <input
                  aria-describedby={submitted && !firstIsValid ? 'first-error' : undefined}
                  aria-invalid={submitted && !firstIsValid}
                  autoComplete="off"
                  className="h-16 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-5 font-mono text-2xl text-[var(--foreground)] transition duration-200 outline-none placeholder:text-[var(--subtle-foreground)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(238,112,46,0.16)]"
                  inputMode="decimal"
                  name="first"
                  onChange={(event) => updateValue('first', event.target.value)}
                  placeholder="0"
                  type="text"
                  value={values.first}
                />
                {submitted && !firstIsValid ? (
                  <span className="mt-2 block text-xs text-[var(--error)]" id="first-error">
                    Enter a valid number.
                  </span>
                ) : null}
              </label>

              <span className="hidden pb-5 font-mono text-2xl text-[var(--accent)] sm:block">
                +
              </span>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--muted-foreground)]">
                  Second number
                </span>
                <input
                  aria-describedby={submitted && !secondIsValid ? 'second-error' : undefined}
                  aria-invalid={submitted && !secondIsValid}
                  autoComplete="off"
                  className="h-16 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-5 font-mono text-2xl text-[var(--foreground)] transition duration-200 outline-none placeholder:text-[var(--subtle-foreground)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(238,112,46,0.16)]"
                  inputMode="decimal"
                  name="second"
                  onChange={(event) => updateValue('second', event.target.value)}
                  placeholder="0"
                  type="text"
                  value={values.second}
                />
                {submitted && !secondIsValid ? (
                  <span className="mt-2 block text-xs text-[var(--error)]" id="second-error">
                    Enter a valid number.
                  </span>
                ) : null}
              </label>
            </div>

            <div
              aria-live="polite"
              className="mt-8 min-h-32 rounded-2xl border border-[var(--line)] bg-[var(--result)] px-6 py-5"
            >
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Sum</p>
              <p className="mt-1 overflow-x-auto font-mono text-5xl tracking-[-0.06em] text-[var(--foreground)] sm:text-6xl">
                {result === null ? '—' : result}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                className="min-h-12 flex-1 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[#20130c] transition duration-200 hover:bg-[#f58d55] focus-visible:ring-4 focus-visible:ring-[rgba(238,112,46,0.28)] focus-visible:outline-none active:translate-y-px"
                type="submit"
              >
                Calculate sum
              </button>
              <button
                className="min-h-12 rounded-xl border border-[var(--line)] px-5 text-sm font-semibold text-[var(--muted-foreground)] transition duration-200 hover:border-[var(--subtle-foreground)] hover:text-[var(--foreground)] focus-visible:ring-4 focus-visible:ring-[rgba(238,112,46,0.16)] focus-visible:outline-none"
                onClick={handleClear}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
