'use client';

import { useEffect, useState } from 'react';

type Operator = '+' | '−' | '×' | '÷';

type ButtonDefinition = {
  label: string;
  action: 'number' | 'operator' | 'decimal' | 'equals' | 'clear' | 'backspace' | 'percent';
  value?: string;
  tone?: 'number' | 'muted' | 'operator' | 'equals';
  wide?: boolean;
};

const operatorKeys: Record<string, Operator> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

const buttons: ButtonDefinition[] = [
  { label: 'Clear', action: 'clear', tone: 'muted' },
  { label: 'Backspace', action: 'backspace', tone: 'muted' },
  { label: 'Percent', action: 'percent', tone: 'muted' },
  { label: 'Divide', action: 'operator', value: '÷', tone: 'operator' },
  { label: '7', action: 'number', value: '7' },
  { label: '8', action: 'number', value: '8' },
  { label: '9', action: 'number', value: '9' },
  { label: 'Multiply', action: 'operator', value: '×', tone: 'operator' },
  { label: '4', action: 'number', value: '4' },
  { label: '5', action: 'number', value: '5' },
  { label: '6', action: 'number', value: '6' },
  { label: 'Subtract', action: 'operator', value: '−', tone: 'operator' },
  { label: '1', action: 'number', value: '1' },
  { label: '2', action: 'number', value: '2' },
  { label: '3', action: 'number', value: '3' },
  { label: 'Add', action: 'operator', value: '+', tone: 'operator' },
  { label: '0', action: 'number', value: '0', wide: true },
  { label: 'Decimal point', action: 'decimal', value: '.' },
  { label: 'Equals', action: 'equals', tone: 'equals' },
];

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10,
    useGrouping: false,
  }).format(value);
}

function calculate(left: number, right: number, operator: Operator): number | null {
  switch (operator) {
    case '+':
      return left + right;
    case '−':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return right === 0 ? null : left / right;
  }
}

function BackspaceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path
        d="M10.5 6.75h8.25a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-8.25L4 12l6.5-5.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="m13 10 4 4m0-4-4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('Ready for a calculation');
  const [error, setError] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('Ready for a calculation');
    setError(null);
    setJustEvaluated(false);
  };

  const enterNumber = (value: string) => {
    if (error || (justEvaluated && !operator)) {
      setDisplay(value);
      setExpression('New calculation');
      setError(null);
      setJustEvaluated(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(value);
      setWaitingForOperand(false);
      return;
    }

    setDisplay((current) => (current === '0' ? value : `${current}${value}`));
    setJustEvaluated(false);
  };

  const enterDecimal = () => {
    if (error || (justEvaluated && !operator)) {
      setDisplay('0.');
      setExpression('New calculation');
      setError(null);
      setJustEvaluated(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    setDisplay((current) => (current.includes('.') ? current : `${current}.`));
  };

  const enterOperator = (nextOperator: Operator) => {
    if (error) {
      return;
    }

    const inputValue = Number(display);
    if (!Number.isFinite(inputValue)) {
      return;
    }

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setOperator(nextOperator);
      setWaitingForOperand(true);
      setExpression(`${formatNumber(inputValue)} ${nextOperator}`);
      setJustEvaluated(false);
      return;
    }

    if (operator && waitingForOperand) {
      setOperator(nextOperator);
      setExpression(`${formatNumber(previousValue)} ${nextOperator}`);
      return;
    }

    if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      if (result === null) {
        setError('Cannot divide by zero');
        setExpression(`${formatNumber(previousValue)} ${operator} 0`);
        return;
      }

      setDisplay(formatNumber(result));
      setPreviousValue(result);
      setOperator(nextOperator);
      setWaitingForOperand(true);
      setExpression(`${formatNumber(result)} ${nextOperator}`);
      setJustEvaluated(false);
    }
  };

  const enterPercent = () => {
    if (error) {
      return;
    }

    const inputValue = Number(display);
    if (!Number.isFinite(inputValue)) {
      return;
    }

    const result = inputValue / 100;
    setDisplay(formatNumber(result));
    setWaitingForOperand(false);
    setJustEvaluated(false);
  };

  const backspace = () => {
    if (error) {
      clear();
      return;
    }

    if (waitingForOperand || justEvaluated) {
      return;
    }

    setDisplay((current) => {
      if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
        return '0';
      }

      return current.slice(0, -1);
    });
  };

  const equals = () => {
    if (error || previousValue === null || operator === null) {
      return;
    }

    if (waitingForOperand) {
      setError('Enter a second number');
      return;
    }

    const inputValue = Number(display);
    const result = calculate(previousValue, inputValue, operator);
    if (result === null) {
      setError('Cannot divide by zero');
      setExpression(`${formatNumber(previousValue)} ${operator} ${formatNumber(inputValue)}`);
      return;
    }

    setExpression(`${formatNumber(previousValue)} ${operator} ${formatNumber(inputValue)} =`);
    setDisplay(formatNumber(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  };

  const handleAction = (button: ButtonDefinition) => {
    switch (button.action) {
      case 'number':
        enterNumber(button.value ?? '0');
        break;
      case 'operator':
        enterOperator(button.value as Operator);
        break;
      case 'decimal':
        enterDecimal();
        break;
      case 'equals':
        equals();
        break;
      case 'clear':
        clear();
        break;
      case 'backspace':
        backspace();
        break;
      case 'percent':
        enterPercent();
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      if (/^\d$/.test(key)) {
        event.preventDefault();
        enterNumber(key);
      } else if (key === '.') {
        event.preventDefault();
        enterDecimal();
      } else {
        const mappedOperator = operatorKeys[key];
        if (mappedOperator) {
          event.preventDefault();
          enterOperator(mappedOperator);
        }
      }

      if (key === '%') {
        event.preventDefault();
        enterPercent();
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        equals();
      } else if (key === 'Escape') {
        event.preventDefault();
        clear();
      } else if (key === 'Backspace') {
        event.preventDefault();
        backspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <section className="calculator-shell" aria-label="Calculator">
      <div className="calculator-display" aria-live="polite">
        <div className="calculator-expression">
          {error ? 'Calculation needs attention' : expression}
        </div>
        <div className={`calculator-result ${error ? 'calculator-result-error' : ''}`}>
          {error ?? display}
        </div>
      </div>

      <div className="calculator-keypad">
        {buttons.map((button) => {
          const isBackspace = button.action === 'backspace';
          const className = [
            'calculator-key',
            `calculator-key-${button.tone ?? 'number'}`,
            button.wide ? 'calculator-key-wide' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              type="button"
              key={button.label}
              className={className}
              aria-label={button.label}
              onClick={() => handleAction(button)}
            >
              {isBackspace ? <BackspaceIcon /> : (button.value ?? button.label)}
            </button>
          );
        })}
      </div>

      <div className="calculator-hint">
        <span className="calculator-hint-dot" aria-hidden="true" />
        Keyboard ready
        <span className="calculator-hint-separator" aria-hidden="true" />
        <kbd>Esc</kbd> clears
        <span className="calculator-hint-separator" aria-hidden="true" />
        <kbd>Enter</kbd> equals
      </div>
    </section>
  );
}
