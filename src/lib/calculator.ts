export type AdditionOutcome =
  | { ok: true; sum: string }
  | {
      ok: false;
      field: 'first' | 'second' | 'both';
      message: string;
    };

type DecimalValue = {
  coefficient: bigint;
  scale: number;
};

const DECIMAL_PATTERN = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;

function parseDecimal(value: string): DecimalValue | null {
  const match = DECIMAL_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const numericValue = Number(value);
  const exponent = Number(match[5] ?? '0');

  if (!Number.isFinite(numericValue) || !Number.isSafeInteger(exponent)) {
    return null;
  }

  const sign = match[1];
  const integerDigits = match[2] ?? '0';
  const fractionalDigits = match[3] ?? match[4] ?? '';
  let coefficient = BigInt(`${sign}${integerDigits}${fractionalDigits}`);

  if (coefficient === 0n) {
    return { coefficient, scale: 0 };
  }

  if (numericValue === 0) {
    return null;
  }

  let scale = fractionalDigits.length - exponent;

  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }

  return { coefficient, scale };
}

function formatDecimal(coefficient: bigint, scale: number): string {
  if (coefficient === 0n) {
    return '0';
  }

  const sign = coefficient < 0n ? '-' : '';
  let digits = (coefficient < 0n ? -coefficient : coefficient).toString();
  const trailingZeros = digits.match(/0+$/)?.[0].length ?? 0;
  const removableZeros = Math.min(scale, trailingZeros);

  if (removableZeros > 0) {
    digits = digits.slice(0, -removableZeros);
    scale -= removableZeros;
  }

  if (scale === 0) {
    return `${sign}${digits}`;
  }

  const paddedDigits = digits.padStart(scale + 1, '0');
  return `${sign}${paddedDigits.slice(0, -scale)}.${paddedDigits.slice(-scale)}`;
}

export function addNumbers(firstInput: string, secondInput: string): AdditionOutcome {
  const first = firstInput.trim();
  const second = secondInput.trim();

  if (first === '' && second === '') {
    return {
      ok: false,
      field: 'both',
      message: 'Enter both numbers to calculate their sum.',
    };
  }

  if (first === '') {
    return {
      ok: false,
      field: 'first',
      message: 'Enter a number in the first field.',
    };
  }

  if (second === '') {
    return {
      ok: false,
      field: 'second',
      message: 'Enter a number in the second field.',
    };
  }

  const firstValue = parseDecimal(first);

  if (!firstValue) {
    return {
      ok: false,
      field: 'first',
      message: 'Enter a valid finite number in the first field.',
    };
  }

  const secondValue = parseDecimal(second);

  if (!secondValue) {
    return {
      ok: false,
      field: 'second',
      message: 'Enter a valid finite number in the second field.',
    };
  }

  const scale = Math.max(firstValue.scale, secondValue.scale);
  const firstCoefficient = firstValue.coefficient * 10n ** BigInt(scale - firstValue.scale);
  const secondCoefficient = secondValue.coefficient * 10n ** BigInt(scale - secondValue.scale);
  const sum = firstCoefficient + secondCoefficient;

  return { ok: true, sum: formatDecimal(sum, scale) };
}
