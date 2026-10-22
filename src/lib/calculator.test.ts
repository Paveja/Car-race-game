import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addNumbers } from './calculator';

describe('addNumbers', () => {
  it('adds positive numbers', () => {
    assert.deepEqual(addNumbers('18', '24'), { ok: true, sum: '42' });
  });

  it('adds decimal numbers exactly', () => {
    assert.deepEqual(addNumbers('0.1', '0.2'), { ok: true, sum: '0.3' });
    assert.deepEqual(addNumbers('1.25e2', '0.75'), {
      ok: true,
      sum: '125.75',
    });
  });

  it('preserves large integers and sums beyond native number range', () => {
    assert.deepEqual(addNumbers('1234567890123456', '0'), {
      ok: true,
      sum: '1234567890123456',
    });
    assert.deepEqual(addNumbers('1e308', '1e308'), {
      ok: true,
      sum: `2${'0'.repeat(308)}`,
    });
  });

  it('adds negative numbers and zero', () => {
    assert.deepEqual(addNumbers('-8', '3'), { ok: true, sum: '-5' });
    assert.deepEqual(addNumbers('0', '0'), { ok: true, sum: '0' });
  });

  it('rejects missing values instead of treating them as zero', () => {
    assert.deepEqual(addNumbers('', ''), {
      ok: false,
      field: 'both',
      message: 'Enter both numbers to calculate their sum.',
    });
    assert.equal(addNumbers('4', '').ok, false);
  });

  it('rejects invalid, non-finite, and underflowing values', () => {
    assert.equal(addNumbers('not a number', '2').ok, false);
    assert.equal(addNumbers('Infinity', '2').ok, false);
    assert.equal(addNumbers('1e309', '2').ok, false);
    assert.equal(addNumbers('1e-324', '2').ok, false);
  });
});
