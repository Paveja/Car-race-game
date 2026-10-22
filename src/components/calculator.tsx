"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalculationError,
  evaluateExpression,
  formatResult,
} from "@/lib/calculator";

type CalculatorKey = {
  label: string;
  ariaLabel: string;
  kind: "number" | "utility" | "operator" | "equals";
  value?: string;
  action?: "clear" | "sign" | "delete" | "calculate";
  wide?: boolean;
};

const KEYS: CalculatorKey[] = [
  { label: "AC", ariaLabel: "Clear all", kind: "utility", action: "clear" },
  {
    label: "±",
    ariaLabel: "Toggle the sign of the current number",
    kind: "utility",
    action: "sign",
  },
  {
    label: "⌫",
    ariaLabel: "Delete the last character",
    kind: "utility",
    action: "delete",
  },
  { label: "÷", ariaLabel: "Divide", kind: "operator", value: "÷" },
  { label: "7", ariaLabel: "7", kind: "number", value: "7" },
  { label: "8", ariaLabel: "8", kind: "number", value: "8" },
  { label: "9", ariaLabel: "9", kind: "number", value: "9" },
  { label: "×", ariaLabel: "Multiply", kind: "operator", value: "×" },
  { label: "4", ariaLabel: "4", kind: "number", value: "4" },
  { label: "5", ariaLabel: "5", kind: "number", value: "5" },
  { label: "6", ariaLabel: "6", kind: "number", value: "6" },
  { label: "−", ariaLabel: "Subtract", kind: "operator", value: "−" },
  { label: "1", ariaLabel: "1", kind: "number", value: "1" },
  { label: "2", ariaLabel: "2", kind: "number", value: "2" },
  { label: "3", ariaLabel: "3", kind: "number", value: "3" },
  { label: "+", ariaLabel: "Add", kind: "operator", value: "+" },
  { label: "0", ariaLabel: "0", kind: "number", value: "0", wide: true },
  { label: ".", ariaLabel: "Decimal point", kind: "number", value: "." },
  {
    label: "=",
    ariaLabel: "Calculate result",
    kind: "equals",
    action: "calculate",
  },
];

const MAX_EXPRESSION_LENGTH = 100;

export function Calculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setExpression("");
    setResult(null);
    setError(null);
  }, []);

  const deleteLast = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
    setResult(null);
    setError(null);
  }, []);

  const appendValue = useCallback(
    (value: string) => {
      setExpression((current) => {
        const startsNewExpression = result !== null && /^[0-9.]$/.test(value);
        const base = startsNewExpression ? "" : (result ?? current);

        if (value === ".") {
          const lastOperator = Math.max(
            base.lastIndexOf("+"),
            base.lastIndexOf("−"),
            base.lastIndexOf("-"),
            base.lastIndexOf("×"),
            base.lastIndexOf("÷"),
            base.lastIndexOf("*"),
            base.lastIndexOf("/"),
          );
          const currentNumber = base.slice(lastOperator + 1);

          if (currentNumber.includes(".")) {
            return base;
          }

          if (currentNumber.length === 0) {
            return `${base}0.`.slice(0, MAX_EXPRESSION_LENGTH);
          }
        }

        if (base.length >= MAX_EXPRESSION_LENGTH) {
          return base;
        }

        return `${base}${value}`;
      });
      setResult(null);
      setError(null);
    },
    [result],
  );

  const toggleSign = useCallback(() => {
    setExpression((current) => {
      const base = result ?? current;
      const lastNumber = /(?:\d+(?:\.\d*)?|\.\d+)$/.exec(base);

      if (lastNumber) {
        const numberStart = lastNumber.index;
        const prefix = base.slice(0, numberStart);
        const sign = prefix.slice(-1);
        const prefixWithoutSign = prefix.slice(0, -1);
        const hasUnarySign =
          (sign === "−" || sign === "-") &&
          (prefixWithoutSign.length === 0 || /[+−×÷*/-]$/.test(prefixWithoutSign));

        if (hasUnarySign) {
          return `${prefixWithoutSign}${base.slice(numberStart)}`;
        }

        return `${prefix}−${base.slice(numberStart)}`.slice(
          0,
          MAX_EXPRESSION_LENGTH,
        );
      }

      if (base.length === 0) {
        return "−";
      }

      return `${base}−`.slice(0, MAX_EXPRESSION_LENGTH);
    });
    setResult(null);
    setError(null);
  }, [result]);

  const calculate = useCallback(() => {
    if (!expression.trim()) {
      setError("Enter a calculation.");
      setResult(null);
      return;
    }

    try {
      const calculatedValue = evaluateExpression(expression);
      setResult(formatResult(calculatedValue));
      setError(null);
    } catch (calculationError) {
      setResult(null);
      setError(
        calculationError instanceof CalculationError
          ? calculationError.message
          : "Could not calculate this expression. Please try again.",
      );
    }
  }, [expression]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearAll();
        return;
      }

      if (event.target instanceof HTMLInputElement) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteLast();
        return;
      }

      if (/^\d$/.test(event.key) || event.key === ".") {
        event.preventDefault();
        appendValue(event.key);
        return;
      }

      const keyboardOperators: Record<string, string> = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷",
      };
      const operator = keyboardOperators[event.key];

      if (operator) {
        event.preventDefault();
        appendValue(operator);
      }
    },
    [appendValue, calculate, clearAll, deleteLast],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  function activateKey(key: CalculatorKey) {
    if (key.action === "clear") {
      clearAll();
      return;
    }

    if (key.action === "delete") {
      deleteLast();
      return;
    }

    if (key.action === "sign") {
      toggleSign();
      return;
    }

    if (key.action === "calculate") {
      calculate();
      return;
    }

    if (key.value) {
      appendValue(key.value);
    }
  }

  return (
    <section className="calculator-panel" aria-label="Calculator">
      <div className="calculator-display">
        <label className="calculator-display__label" htmlFor="calc-expression">
          Expression
        </label>
        <input
          id="calc-expression"
          className="calculator-display__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={MAX_EXPRESSION_LENGTH}
          placeholder="0 + 0"
          value={expression}
          onChange={(event) => {
            setExpression(event.target.value.slice(0, MAX_EXPRESSION_LENGTH));
            setResult(null);
            setError(null);
          }}
        />
        <div className="calculator-result">
          <span className="calculator-result__label">Result</span>
          <output
            className="calculator-result__value"
            aria-live="polite"
            aria-atomic="true"
          >
            {result ?? "—"}
          </output>
        </div>
      </div>

      {error && (
        <p className="calculator-error" role="alert">
          {error}
        </p>
      )}

      <div className="keypad" role="group" aria-label="Calculator keypad">
        {KEYS.map((key) => {
          const active = key.value !== undefined &&
            expression.trim().endsWith(key.value);
          const classNames = [
            "keypad__key",
            `keypad__key--${key.kind}`,
            key.wide ? "keypad__key--wide" : "",
            active ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={key.label}
              type="button"
              className={classNames}
              aria-label={key.ariaLabel}
              onClick={() => activateKey(key)}
            >
              {key.label}
            </button>
          );
        })}
      </div>

      <p className="keyboard-hint">
        Keyboard: Enter to calculate, Backspace to delete, Escape to clear.
      </p>
    </section>
  );
}
