export class CalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalculationError";
  }
}

const TOKEN_PATTERN = /\s*(\d+(?:\.\d*)?|\.\d+|[+\-*])\s*/y;

function tokenize(expression: string): string[] {
  const normalized = expression
    .replace(/×/g, "*")
    .replace(/−/g, "-");
  const tokens: string[] = [];
  let position = 0;

  while (position < normalized.length) {
    TOKEN_PATTERN.lastIndex = position;
    const match = TOKEN_PATTERN.exec(normalized);

    if (!match) {
      throw new CalculationError("Enter a valid calculation.");
    }

    tokens.push(match[1]);
    position = TOKEN_PATTERN.lastIndex;
  }

  if (tokens.length === 0) {
    throw new CalculationError("Enter a calculation.");
  }

  return tokens;
}

export function evaluateExpression(expression: string): number {
  const tokens = tokenize(expression);
  let position = 0;

  function parseNumber(): number {
    const token = tokens[position];

    if (token === undefined) {
      throw new CalculationError("Complete the expression before calculating.");
    }

    if (token === "+" || token === "-") {
      position += 1;
      const value = parseNumber();
      return token === "-" ? -value : value;
    }

    if (token === "*") {
      throw new CalculationError("Enter a valid calculation.");
    }

    const value = Number(token);

    if (!Number.isFinite(value)) {
      throw new CalculationError("Enter a valid calculation.");
    }

    position += 1;
    return value;
  }

  function parseTerm(): number {
    let value = parseNumber();

    while (tokens[position] === "*") {
      position += 1;
      const nextValue = parseNumber();
      value *= nextValue;

      if (!Number.isFinite(value)) {
        throw new CalculationError("This result is too large to display.");
      }
    }

    return value;
  }

  function parseExpression(): number {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position];
      position += 1;
      const nextValue = parseTerm();
      value = operator === "+" ? value + nextValue : value - nextValue;

      if (!Number.isFinite(value)) {
        throw new CalculationError("This result is too large to display.");
      }
    }

    return value;
  }

  const result = parseExpression();

  if (position !== tokens.length) {
    throw new CalculationError("Enter a valid calculation.");
  }

  return Object.is(result, -0) ? 0 : result;
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    throw new CalculationError("This result is too large to display.");
  }

  const rounded = Number(value.toPrecision(12));
  const normalized = Object.is(rounded, -0) ? 0 : rounded;

  return normalized.toString().replace(/-/g, "−");
}
