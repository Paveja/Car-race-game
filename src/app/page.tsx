'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Operator = '+' | '-' | '×' | '÷';
type CalculatorStatus = 'idle' | 'active' | 'result' | 'error';

type ButtonKey = {
  label: string;
  value: string;
  kind: 'utility' | 'operator' | 'number' | 'decimal' | 'equals';
  ariaLabel?: string;
  wide?: boolean;
};

const operatorSymbols = new Set<Operator>(['+', '-', '×', '÷']);
const numberPattern = /^\d+(?:\.\d+)?$/;

const calculatorKeys: ButtonKey[] = [
  { label: 'C', value: 'clear', kind: 'utility', ariaLabel: 'Clear calculator' },
  { label: '⌫', value: 'backspace', kind: 'utility', ariaLabel: 'Backspace' },
  { label: '÷', value: '÷', kind: 'operator', ariaLabel: 'Divide' },
  { label: '7', value: '7', kind: 'number' },
  { label: '8', value: '8', kind: 'number' },
  { label: '9', value: '9', kind: 'number' },
  { label: '×', value: '×', kind: 'operator', ariaLabel: 'Multiply' },
  { label: '4', value: '4', kind: 'number' },
  { label: '5', value: '5', kind: 'number' },
  { label: '6', value: '6', kind: 'number' },
  { label: '−', value: '-', kind: 'operator', ariaLabel: 'Subtract' },
  { label: '1', value: '1', kind: 'number' },
  { label: '2', value: '2', kind: 'number' },
  { label: '3', value: '3', kind: 'number' },
  { label: '+', value: '+', kind: 'operator', ariaLabel: 'Add' },
  { label: '0', value: '0', kind: 'number', wide: true },
  { label: '.', value: '.', kind: 'decimal', ariaLabel: 'Decimal point' },
  { label: '=', value: 'equals', kind: 'equals', ariaLabel: 'Calculate' },
];

function calculate(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d+)?|[+×÷-]/g);

  if (!tokens || tokens.join('') !== expression || tokens.length % 2 === 0) {
    throw new Error('Finish the expression');
  }

  const firstToken = tokens[0];

  if (!firstToken || !numberPattern.test(firstToken)) {
    throw new Error('Start with a number');
  }

  const values = [Number(firstToken)];
  const operators: Operator[] = [];
  const precedence: Record<Operator, number> = {
    '+': 1,
    '-': 1,
    '×': 2,
    '÷': 2,
  };

  const applyOperation = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();

    if (operator === undefined || left === undefined || right === undefined) {
      throw new Error('Finish the expression');
    }

    if (operator === '÷' && right === 0) {
      throw new Error('Cannot divide by zero');
    }

    const result =
      operator === '+'
        ? left + right
        : operator === '-'
          ? left - right
          : operator === '×'
            ? left * right
            : left / right;

    values.push(result);
  };

  for (let index = 1; index < tokens.length; index += 2) {
    const operatorToken = tokens[index];
    const numberToken = tokens[index + 1];

    if (!operatorToken || !numberToken || !operatorSymbols.has(operatorToken as Operator)) {
      throw new Error('Finish the expression');
    }

    const operator = operatorToken as Operator;

    if (!numberPattern.test(numberToken)) {
      throw new Error('Enter a valid number');
    }

    while (
      operators.length > 0 &&
      precedence[operators[operators.length - 1] as Operator] >= precedence[operator]
    ) {
      applyOperation();
    }

    operators.push(operator);
    values.push(Number(numberToken));
  }

  while (operators.length > 0) {
    applyOperation();
  }

  const result = values[0];

  if (result === undefined || !Number.isFinite(result)) {
    throw new Error('That result is too large');
  }

  return result;
}

function formatNumber(value: number): string {
  const rounded = Object.is(value, -0) ? 0 : Number(value.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

function BackspaceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path
        d="M9 5.5h10.25A1.75 1.75 0 0 1 21 7.25v9.5a1.75 1.75 0 0 1-1.75 1.75H9L3 12l6-6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m13 9.5 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<CalculatorStatus>('idle');
  const [message, setMessage] = useState('Ready when you are');

  const displayValue = useMemo(() => {
    if (status === 'result') return result;
    return expression || '0';
  }, [expression, result, status]);

  const handleInput = useCallback(
    (value: string) => {
      if (value === 'clear') {
        setExpression('');
        setResult('');
        setStatus('idle');
        setMessage('Ready when you are');
        return;
      }

      if (value === 'backspace') {
        if (status === 'result' || status === 'error') {
          setExpression('');
          setResult('');
          setStatus('idle');
          setMessage('Ready when you are');
          return;
        }

        setExpression((current) => current.slice(0, -1));
        setStatus((current) => (current === 'idle' ? current : 'active'));
        setMessage('');
        return;
      }

      if (value === 'equals') {
        if (!expression) {
          setStatus('error');
          setMessage('Enter an expression first');
          return;
        }

        try {
          const calculated = calculate(expression);
          setResult(formatNumber(calculated));
          setStatus('result');
          setMessage('Calculated');
        } catch (error) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'Check your expression');
        }
        return;
      }

      if (/^\d$/.test(value)) {
        if (status === 'result' || status === 'error') {
          setExpression(value);
          setResult('');
        } else {
          setExpression((current) => {
            const lastOperatorIndex = Math.max(
              current.lastIndexOf('+'),
              current.lastIndexOf('-'),
              current.lastIndexOf('×'),
              current.lastIndexOf('÷')
            );
            const currentOperand = current.slice(lastOperatorIndex + 1);

            if (currentOperand === '0') return current.slice(0, -1) + value;
            return current + value;
          });
        }

        setStatus('active');
        setMessage('');
        return;
      }

      if (value === '.') {
        if (status === 'result' || status === 'error') {
          setExpression('0.');
          setResult('');
        } else {
          setExpression((current) => {
            const lastOperatorIndex = Math.max(
              current.lastIndexOf('+'),
              current.lastIndexOf('-'),
              current.lastIndexOf('×'),
              current.lastIndexOf('÷')
            );
            const currentOperand = current.slice(lastOperatorIndex + 1);

            if (currentOperand.includes('.')) return current;
            if (!currentOperand) return current + '0.';
            return current + '.';
          });
        }

        setStatus('active');
        setMessage('');
        return;
      }

      if (operatorSymbols.has(value as Operator)) {
        if (status === 'result') {
          setExpression(result.replaceAll(',', '') + value);
          setResult('');
        } else if (status === 'error') {
          setExpression(value === '-' ? '-' : '');
          setResult('');
        } else {
          setExpression((current) => {
            if (!current && value === '-') return '-';
            if (!current) return current;
            if (operatorSymbols.has(current.slice(-1) as Operator))
              return current.slice(0, -1) + value;
            return current + value;
          });
        }

        setStatus('active');
        setMessage('');
      }
    },
    [expression, result, status]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        Enter: 'equals',
        '=': 'equals',
        Escape: 'clear',
        Backspace: 'backspace',
        '*': '×',
        '/': '÷',
      };
      const value = keyMap[event.key] ?? event.key;

      if (
        /^\d$/.test(value) ||
        value === '.' ||
        event.key in keyMap ||
        operatorSymbols.has(value as Operator)
      ) {
        event.preventDefault();
        handleInput(value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[440px] flex-col justify-center sm:min-h-[calc(100vh-5rem)]">
        <header className="mb-5 flex items-end justify-between px-1">
          <div>
            <p className="eyebrow">Pocket instrument</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2rem]">
              Calculator
            </h1>
          </div>
          <p className="hidden pb-1 text-right text-[0.68rem] font-semibold tracking-[0.16em] text-[var(--ink-soft)] uppercase sm:block">
            Quick math
            <br />
            no noise
          </p>
        </header>

        <section className="calculator-shell" aria-label="Calculator">
          <div className="calculator-display" aria-live="polite" aria-atomic="true">
            <div className="flex min-h-6 items-center justify-between gap-4">
              <span className="display-status">
                {status === 'error' ? 'Check input' : status === 'result' ? 'Calculated' : 'Ready'}
              </span>
              <span className="display-hint">{message}</span>
            </div>
            <p className={`display-value ${status === 'error' ? 'display-error' : ''}`}>
              {displayValue}
            </p>
            <p className="display-expression">
              {status === 'result' ? expression : 'Type or tap to begin'}
            </p>
          </div>

          <div className="keypad" aria-label="Calculator keypad">
            {calculatorKeys.map((key) => {
              const isBackspace = key.value === 'backspace';
              const buttonClass = ['calculator-key', `key-${key.kind}`, key.wide ? 'key-wide' : '']
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={key.value}
                  type="button"
                  className={buttonClass}
                  aria-label={key.ariaLabel ?? key.label}
                  onClick={() => handleInput(key.value)}
                >
                  {isBackspace ? <BackspaceIcon /> : key.label}
                </button>
              );
            })}
          </div>
        </section>

        <footer className="mt-5 flex items-center justify-between px-1 text-[0.68rem] font-semibold tracking-[0.14em] text-[var(--ink-soft)] uppercase">
          <span>Clear: Esc</span>
          <span>Enter: =</span>
        </footer>
      </div>
    </main>
  );
}
