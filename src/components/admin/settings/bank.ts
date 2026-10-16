/** IBAN / BIC validation and formatting for the bank details form. */

// Lengths of the IBANs most likely to be entered (SEPA area); other countries only get the mod-97 check.
const IBAN_LENGTH: Record<string, number> = {
  DE: 22, AT: 20, CH: 21, NL: 18, BE: 16, FR: 27, LU: 20, IT: 27, ES: 24, DK: 18, SE: 24, PL: 28, CZ: 24, GB: 22, IE: 22, TR: 26,
};

export const compactIban = (v: string) => v.replace(/[\s.-]/g, '').toUpperCase();

/** ISO 13616 check: country code, check digits and mod-97 == 1. */
export function isValidIban(raw: string) {
  const iban = compactIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const len = IBAN_LENGTH[iban.slice(0, 2)];
  if (len && iban.length !== len) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const ch of rearranged) {
    const n = ch >= 'A' ? ch.charCodeAt(0) - 55 : Number(ch);
    rest = n > 9 ? (rest * 100 + n) % 97 : (rest * 10 + n) % 97;
  }
  return rest === 1;
}

/** "DE43250500000152061370" -> "DE43 2505 0000 0152 0613 70" */
export const formatIban = (raw: string) => compactIban(raw).replace(/(.{4})(?=.)/g, '$1 ');

export const compactBic = (v: string) => v.replace(/\s/g, '').toUpperCase();
export const isValidBic = (raw: string) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(compactBic(raw));
