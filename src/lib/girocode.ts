import QRCode from 'qrcode';
import { getSite } from './content';

/**
 * EPC QR code ("GiroCode") payload per EPC069-12 v3.0, version 002 (BIC optional), UTF-8.
 * Lines are LF-separated and the payload must not end with a separator.
 */
export function epcPayload(amount?: number, reference?: string) {
  const site = getSite();
  reference ??= site.bank.reference;
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    site.bank.bic,
    site.bank.accountHolder.slice(0, 70),
    site.bank.iban.replace(/\s+/g, ''),
    amount ? `EUR${amount.toFixed(2)}` : '',
    'CHAR',
    '',
    reference.slice(0, 140),
  ];
  return lines.join('\n').replace(/\n+$/, '');
}

/** Static SVG generated at build time: no third-party QR service, no runtime cost. */
export async function giroCodeSvg(amount?: number, reference?: string) {
  return QRCode.toString(epcPayload(amount, reference), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#2a2420', light: '#00000000' },
  });
}
