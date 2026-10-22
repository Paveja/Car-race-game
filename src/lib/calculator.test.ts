import { describe, expect, it } from "vitest";
import {
  CalculationError,
  evaluateExpression,
  formatResult,
} from "./calculator";

describe("evaluateExpression", () => {
  it("supports each of the four arithmetic operations", () => {
    expect(evaluateExpression("8 + 5")).toBe(13);
    expect(evaluateExpression("8 − 5")).toBe(3);
    expect(evaluateExpression("8 × 5")).toBe(40);
    expect(evaluateExpression("8 ÷ 4")).toBe(2);
  });

  it("follows standard operator precedence", () => {
    expect(evaluateExpression("3 + 4 × 2")).toBe(11);
    expect(evaluateExpression("20 − 8 ÷ 2")).toBe(16);
  });

  it("evaluates operators at the same precedence left to right", () => {
    expect(evaluateExpression("12 ÷ 3 × 2")).toBe(8);
    expect(evaluateExpression("10 − 3 − 2")).toBe(5);
  });

  it("supports decimal and negative values", () => {
    expect(evaluateExpression("0.1 + 0.2")).toBeCloseTo(0.3);
    expect(evaluateExpression("−3 × 2")).toBe(-6);
    expect(evaluateExpression("3 × −2")).toBe(-6);
    expect(evaluateExpression("−−2")).toBe(2);
  });

  it("rejects division by zero", () => {
    expect(() => evaluateExpression("12 ÷ 0")).toThrow(CalculationError);
    expect(() => evaluateExpression("12 ÷ 0")).toThrow("Cannot divide by zero.");
  });

  it("rejects incomplete and malformed expressions", () => {
    expect(() => evaluateExpression("5 +")).toThrow(
      "Complete the expression before calculating.",
    );
    expect(() => evaluateExpression("2 + * 3")).toThrow(
      "Enter a valid calculation.",
    );
    expect(() => evaluateExpression("4 + unknown")).toThrow(
      "Enter a valid calculation.",
    );
    expect(() => evaluateExpression("2(3 + 4)")).toThrow(
      "Enter a valid calculation.",
    );
  });

  it("rejects non-finite results", () => {
    const oversizedNumber = "9".repeat(200);

    expect(() => evaluateExpression(`${oversizedNumber} × ${oversizedNumber}`)).toThrow(
      "This result is too large to display.",
    );
  });

  it("formats floating-point noise and negative signs for display", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
    expect(formatResult(-42)).toBe("−42");
    expect(formatResult(1 / 3)).toBe("0.333333333333");
  });
});
