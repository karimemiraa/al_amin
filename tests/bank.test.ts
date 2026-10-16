import { describe, expect, it } from 'vitest';
import { formatIban, isValidBic, isValidIban } from '../src/components/admin/settings/bank';

describe('IBAN validation', () => {
  it('accepts valid IBANs with or without spaces', () => {
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('de89 3704 0044 0532 0130 00')).toBe(true);
    expect(isValidIban('GB82 WEST 1234 5698 7654 32')).toBe(true);
    expect(isValidIban('NL91ABNA0417164300')).toBe(true);
  });

  it('rejects a single wrong digit (mod-97)', () => {
    expect(isValidIban('DE89370400440532013001')).toBe(false);
    expect(isValidIban('DE88370400440532013000')).toBe(false);
  });

  it('rejects wrong length for known countries and garbage', () => {
    expect(isValidIban('DE8937040044053201300')).toBe(false);
    expect(isValidIban('')).toBe(false);
    expect(isValidIban('not an iban')).toBe(false);
  });

  it('formats in groups of four', () => {
    expect(formatIban('de89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
  });
});

describe('BIC validation', () => {
  it('accepts 8 and 11 character BICs', () => {
    expect(isValidBic('NOLADE2H')).toBe(true);
    expect(isValidBic('nola de2h xxx')).toBe(true);
  });
  it('rejects malformed BICs', () => {
    expect(isValidBic('NOLA2H')).toBe(false);
    expect(isValidBic('1234DE2H')).toBe(false);
  });
});
